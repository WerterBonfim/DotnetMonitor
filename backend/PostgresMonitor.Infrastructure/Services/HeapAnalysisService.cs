using System.Diagnostics;
using Microsoft.Diagnostics.Runtime;
using Microsoft.Extensions.Logging;
using PostgresMonitor.Core.DTOs;
using AllocationStackTrace = PostgresMonitor.Infrastructure.Services.AllocationStackTrace;

namespace PostgresMonitor.Infrastructure.Services;

public sealed class HeapAnalysisService
{
    private readonly ILogger<HeapAnalysisService> _logger;
    private readonly AllocationTrackingService? _allocationTrackingService;
    private const long LargeObjectThreshold = 85 * 1024; // 85KB

    public HeapAnalysisService(
        ILogger<HeapAnalysisService> logger,
        AllocationTrackingService? allocationTrackingService = null)
    {
        _logger = logger;
        _allocationTrackingService = allocationTrackingService;
    }

    public async Task<HeapAnalysisDto?> GetHeapAnalysisAsync(int processId, int topN = 10, bool includeAllocationStacks = false, CancellationToken cancellationToken = default)
    {
        try
        {
            // Verificar se o processo existe
            Process? process;
            try
            {
                process = Process.GetProcessById(processId);
                if (process.HasExited)
                {
                    _logger.LogWarning("Processo {ProcessId} já foi finalizado", processId);
                    return null;
                }
            }
            catch (ArgumentException)
            {
                _logger.LogWarning("Processo {ProcessId} não encontrado", processId);
                return null;
            }

            return await Task.Run(() => AnalyzeHeap(processId, topN, includeAllocationStacks, cancellationToken), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao analisar heap do processo {ProcessId}", processId);
            return null;
        }
    }

    private HeapAnalysisDto? AnalyzeHeap(int processId, int topN, bool includeAllocationStacks, CancellationToken cancellationToken)
    {
        DataTarget? dataTarget = null;
        try
        {
            // Conectar ao processo
            dataTarget = DataTarget.AttachToProcess(processId, suspend: false);
            
            if (dataTarget.ClrVersions.Length == 0)
            {
                _logger.LogWarning("Processo {ProcessId} não é um processo .NET ou não possui runtime CLR carregado", processId);
                return null;
            }

            var clrInfo = dataTarget.ClrVersions[0];
            var runtime = clrInfo.CreateRuntime();
            var heap = runtime.Heap;

            if (!heap.CanWalkHeap)
            {
                _logger.LogWarning("Não é possível caminhar pelo heap do processo {ProcessId}", processId);
                return null;
            }

            // Estatísticas por tipo
            var typeStats = new Dictionary<string, TypeStatistics>();
            var namespaceStats = new Dictionary<string, NamespaceStatistics>();
            var arrayElementStats = new Dictionary<string, ArrayElementStatistics>();
            var largeObjects = new List<LargeObjectInfo>();
            long totalHeapBytes = 0;
            long totalObjectCount = 0;
            long lohBytes = 0;
            long lohObjectCount = 0;
            long threadObjectsBytes = 0;
            long threadObjectsCount = 0;
            long taskObjectsBytes = 0;
            long taskObjectsCount = 0;
            var uniqueTypes = new HashSet<string>();

            // Enumerar todos os objetos do heap
            foreach (var obj in heap.EnumerateObjects())
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    _logger.LogWarning("Análise de heap cancelada para processo {ProcessId}", processId);
                    return null;
                }

                var type = heap.GetObjectType(obj);
                if (type == null) continue;

                var typeName = type.Name ?? "<unknown>";
                var ns = ExtractNamespace(typeName);
                var isArray = type.IsArray;
                string? arrayElementType = null;
                
                if (isArray)
                {
                    // Tentar obter o tipo do elemento do array
                    try
                    {
                        // ComponentType retorna ClrType (tipo do elemento)
                        if (type.ComponentType != null)
                        {
                            arrayElementType = type.ComponentType.Name;
                        }
                        else
                        {
                            // Se ComponentType não estiver disponível, tentar extrair do nome
                            // Ex: "System.String[]" → "System.String"
                            if (typeName.EndsWith("[]"))
                            {
                                arrayElementType = typeName[..^2];
                            }
                            else if (typeName.Contains('[') && typeName.Contains(']'))
                            {
                                // Para arrays genéricos como "System.Collections.Generic.List`1[System.String]"
                                var startBracket = typeName.IndexOf('[');
                                var endBracket = typeName.LastIndexOf(']');
                                if (startBracket > 0 && endBracket > startBracket)
                                {
                                    var innerType = typeName.Substring(startBracket + 1, endBracket - startBracket - 1);
                                    // Pode conter múltiplos tipos separados por vírgula, pegar o primeiro
                                    arrayElementType = innerType.Split(',')[0].Trim();
                                }
                            }
                        }
                    }
                    catch
                    {
                        // Se falhar, tentar extrair do nome (ex: "System.String[]" → "System.String")
                        if (typeName.EndsWith("[]"))
                        {
                            arrayElementType = typeName[..^2];
                        }
                    }
                }
                
                var isThreadRelated = IsThreadRelated(typeName);
                
                // Obter tamanho do objeto usando ClrObject
                var clrObj = heap.GetObject(obj);
                var size = clrObj.Size;
                
                if (size == 0) continue; // Ignorar objetos com tamanho zero

                totalHeapBytes += (long)size;
                totalObjectCount++;
                uniqueTypes.Add(typeName);

                // Atualizar estatísticas por tipo
                if (!typeStats.TryGetValue(typeName, out var stats))
                {
                    stats = new TypeStatistics
                    {
                        Namespace = ns,
                        IsArray = isArray,
                        ArrayElementType = arrayElementType,
                        IsThreadRelated = isThreadRelated
                    };
                    typeStats[typeName] = stats;
                }

                stats.TotalBytes += (long)size;
                stats.InstanceCount++;

                // Atualizar estatísticas por namespace
                if (!namespaceStats.TryGetValue(ns, out var nsStats))
                {
                    nsStats = new NamespaceStatistics { Namespace = ns };
                    namespaceStats[ns] = nsStats;
                }
                nsStats.TotalBytes += (long)size;
                nsStats.InstanceCount++;
                nsStats.Types.Add(typeName);
                if (!nsStats.TypeDetails.TryGetValue(typeName, out var typeDetail))
                {
                    nsStats.TypeDetails[typeName] = ((long)size, 1);
                }
                else
                {
                    nsStats.TypeDetails[typeName] = (typeDetail.bytes + (long)size, typeDetail.count + 1);
                }

                // Atualizar estatísticas de arrays
                if (isArray && !string.IsNullOrEmpty(arrayElementType))
                {
                    var arrayKey = arrayElementType;
                    if (!arrayElementStats.TryGetValue(arrayKey, out var arrayStats))
                    {
                        arrayStats = new ArrayElementStatistics
                        {
                            ElementTypeName = arrayElementType,
                            ArrayTypeName = typeName
                        };
                        arrayElementStats[arrayKey] = arrayStats;
                    }
                    arrayStats.TotalArrays++;
                    arrayStats.TotalBytes += (long)size;
                }

                // Atualizar estatísticas de threads
                if (isThreadRelated)
                {
                    threadObjectsBytes += (long)size;
                    threadObjectsCount++;
                    
                    if (typeName.StartsWith("System.Threading.Tasks.Task", StringComparison.Ordinal))
                    {
                        taskObjectsBytes += (long)size;
                        taskObjectsCount++;
                    }
                }

                // Verificar se é objeto grande (LOH)
                if (size >= LargeObjectThreshold)
                {
                    lohBytes += (long)size;
                    lohObjectCount++;

                    // Adicionar aos objetos grandes
                    var existingLargeIndex = largeObjects.FindIndex(l => l.TypeName == typeName);
                    if (existingLargeIndex == -1)
                    {
                        largeObjects.Add(new LargeObjectInfo
                        {
                            TypeName = typeName,
                            Namespace = ns,
                            IsArray = isArray,
                            ArrayElementType = arrayElementType,
                            SizeBytes = (long)size,
                            InstanceCount = 1
                        });
                    }
                    else
                    {
                        var existing = largeObjects[existingLargeIndex];
                        largeObjects[existingLargeIndex] = new LargeObjectInfo
                        {
                            TypeName = typeName,
                            Namespace = ns,
                            IsArray = isArray,
                            ArrayElementType = arrayElementType,
                            SizeBytes = existing.SizeBytes + (long)size,
                            InstanceCount = existing.InstanceCount + 1
                        };
                    }
                }
            }

            // Coletar informações de threads do runtime
            var totalThreads = runtime.Threads.Length;

            // Obter stack traces de alocação se solicitado
            Dictionary<string, List<AllocationStackTrace>>? allocationStacks = null;
            if (includeAllocationStacks && _allocationTrackingService != null)
            {
                try
                {
                    allocationStacks = _allocationTrackingService.GetAllocationStacksAsync(processId, cancellationToken: cancellationToken).GetAwaiter().GetResult();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Não foi possível obter stack traces de alocação para processo {ProcessId}", processId);
                }
            }

            // Converter para DTOs
            var topTypesByMemory = typeStats
                .Select(kvp =>
                {
                    AllocationOriginDto[]? origins = null;
                    if (includeAllocationStacks && allocationStacks != null && allocationStacks.TryGetValue(kvp.Key, out var stacks))
                    {
                        // Agrupar por método/classe e contar ocorrências
                        var grouped = stacks
                            .GroupBy(s => new { s.MethodName, s.ClassName, s.Namespace })
                            .OrderByDescending(g => g.Count())
                            .Take(5)
                            .Select(g => new AllocationOriginDto(
                                TypeName: kvp.Key,
                                MethodName: g.Key.MethodName,
                                ClassName: g.Key.ClassName,
                                Namespace: g.Key.Namespace,
                                FileName: g.First().FileName,
                                LineNumber: g.First().LineNumber,
                                StackFrames: g.First().StackFrames,
                                AllocationCount: g.Count()
                            ))
                            .ToArray();

                        if (grouped.Length > 0)
                        {
                            origins = grouped;
                        }
                    }

                    return new TypeMemoryInfoDto(
                        TypeName: kvp.Key,
                        Namespace: kvp.Value.Namespace,
                        IsArray: kvp.Value.IsArray,
                        ArrayElementType: kvp.Value.ArrayElementType,
                        IsThreadRelated: kvp.Value.IsThreadRelated,
                        TotalBytes: kvp.Value.TotalBytes,
                        InstanceCount: kvp.Value.InstanceCount,
                        AverageBytesPerInstance: kvp.Value.InstanceCount > 0 
                            ? (double)kvp.Value.TotalBytes / kvp.Value.InstanceCount 
                            : 0,
                        PercentageOfTotal: totalHeapBytes > 0 
                            ? (double)kvp.Value.TotalBytes / totalHeapBytes * 100 
                            : 0,
                        AllocationOrigins: origins
                    );
                })
                .OrderByDescending(t => t.TotalBytes)
                .Take(topN)
                .ToArray();

            var topTypesByCount = typeStats
                .Select(kvp => new TypeCountInfoDto(
                    TypeName: kvp.Key,
                    Namespace: kvp.Value.Namespace,
                    IsArray: kvp.Value.IsArray,
                    ArrayElementType: kvp.Value.ArrayElementType,
                    IsThreadRelated: kvp.Value.IsThreadRelated,
                    InstanceCount: kvp.Value.InstanceCount,
                    TotalBytes: kvp.Value.TotalBytes,
                    PercentageOfTotalCount: totalObjectCount > 0 
                        ? (double)kvp.Value.InstanceCount / totalObjectCount * 100 
                        : 0
                ))
                .OrderByDescending(t => t.InstanceCount)
                .Take(topN)
                .ToArray();

            var largeObjectsDto = largeObjects
                .OrderByDescending(l => l.SizeBytes)
                .Take(topN)
                .Select(l => new LargeObjectInfoDto(
                    TypeName: l.TypeName,
                    Namespace: l.Namespace,
                    IsArray: l.IsArray,
                    ArrayElementType: l.ArrayElementType,
                    SizeBytes: l.SizeBytes,
                    InstanceCount: l.InstanceCount
                ))
                .ToArray();

            // Top Namespaces por Memória
            var topNamespacesByMemory = namespaceStats
                .Select(kvp => new
                {
                    Namespace = kvp.Key,
                    Stats = kvp.Value,
                    IsProblematic = IsProblematicNamespace(kvp.Key, kvp.Value.TotalBytes, kvp.Value.InstanceCount)
                })
                .OrderByDescending(ns => ns.Stats.TotalBytes)
                .Take(topN)
                .Select(ns =>
                {
                    var topTypesInNamespace = ns.Stats.TypeDetails
                        .OrderByDescending(t => t.Value.bytes)
                        .Take(5)
                        .Select(t => new TypeMemoryInfoDto(
                            TypeName: t.Key,
                            Namespace: ns.Namespace,
                            IsArray: typeStats.TryGetValue(t.Key, out var ts) && ts.IsArray,
                            ArrayElementType: typeStats.TryGetValue(t.Key, out var ts2) ? ts2.ArrayElementType : null,
                            IsThreadRelated: typeStats.TryGetValue(t.Key, out var ts3) && ts3.IsThreadRelated,
                            TotalBytes: t.Value.bytes,
                            InstanceCount: t.Value.count,
                            AverageBytesPerInstance: t.Value.count > 0 ? (double)t.Value.bytes / t.Value.count : 0,
                            PercentageOfTotal: totalHeapBytes > 0 ? (double)t.Value.bytes / totalHeapBytes * 100 : 0,
                            AllocationOrigins: null
                        ))
                        .ToArray();

                    // Obter top métodos de alocação para este namespace
                    string[]? topMethods = null;
                    if (includeAllocationStacks && allocationStacks != null)
                    {
                        var methods = allocationStacks
                            .Where(kvp => kvp.Value.Any(s => s.Namespace == ns.Namespace))
                            .SelectMany(kvp => kvp.Value)
                            .Where(s => s.Namespace == ns.Namespace && !string.IsNullOrEmpty(s.MethodName))
                            .GroupBy(s => $"{s.ClassName}.{s.MethodName}")
                            .OrderByDescending(g => g.Count())
                            .Take(5)
                            .Select(g => g.Key)
                            .ToArray();

                        if (methods.Length > 0)
                        {
                            topMethods = methods;
                        }
                    }

                    return new NamespaceStatsDto(
                        Namespace: ns.Namespace,
                        TotalBytes: ns.Stats.TotalBytes,
                        InstanceCount: ns.Stats.InstanceCount,
                        TypeCount: ns.Stats.Types.Count,
                        TopTypes: topTypesInNamespace,
                        IsProblematic: ns.IsProblematic,
                        TopAllocationMethods: topMethods
                    );
                })
                .ToArray();

            // Top Array Elements
            var topArrayElements = arrayElementStats
                .Select(kvp => new ArrayElementStatsDto(
                    ElementTypeName: kvp.Value.ElementTypeName,
                    ArrayTypeName: kvp.Value.ArrayTypeName,
                    TotalArrays: kvp.Value.TotalArrays,
                    TotalBytes: kvp.Value.TotalBytes,
                    AverageArraySize: kvp.Value.TotalArrays > 0 
                        ? (double)kvp.Value.TotalBytes / kvp.Value.TotalArrays 
                        : 0
                ))
                .OrderByDescending(a => a.TotalBytes)
                .Take(topN)
                .ToArray();

            // Thread Analysis
            var threadAnalysis = new ThreadAnalysisDto(
                TotalThreads: totalThreads,
                ThreadObjectsCount: threadObjectsCount,
                ThreadObjectsBytes: threadObjectsBytes,
                TaskObjectsCount: taskObjectsCount,
                TaskObjectsBytes: taskObjectsBytes
            );

            var summary = new HeapSummaryDto(
                TotalHeapBytes: totalHeapBytes,
                TotalObjectCount: totalObjectCount,
                TotalTypeCount: uniqueTypes.Count,
                LohBytes: lohBytes,
                LohObjectCount: lohObjectCount
            );

            var insights = GenerateInsights(summary, topTypesByMemory, largeObjectsDto, topNamespacesByMemory, topArrayElements, threadAnalysis);

            var analysis = new HeapAnalysisDto(
                Id: $"heap-analysis-{processId}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                Timestamp: DateTime.UtcNow,
                TopTypesByMemory: topTypesByMemory,
                TopTypesByCount: topTypesByCount,
                LargeObjects: largeObjectsDto,
                TopNamespacesByMemory: topNamespacesByMemory,
                TopArrayElements: topArrayElements,
                ThreadAnalysis: threadAnalysis,
                Summary: summary,
                HumanizedInsights: insights
            );

            return analysis;
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Erro ao conectar ao processo {ProcessId}: {Message}", processId, ex.Message);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao analisar heap do processo {ProcessId}", processId);
            return null;
        }
        finally
        {
            dataTarget?.Dispose();
        }
    }

    private string[] GenerateInsights(
        HeapSummaryDto summary, 
        TypeMemoryInfoDto[] topTypesByMemory, 
        LargeObjectInfoDto[] _,
        NamespaceStatsDto[] topNamespaces,
        ArrayElementStatsDto[] topArrayElements,
        ThreadAnalysisDto threadAnalysis)
    {
        var insights = new List<string>();

        if (summary.LohBytes > summary.TotalHeapBytes * 0.4)
        {
            insights.Add($"Large Object Heap está ocupando {summary.LohBytes * 100.0 / summary.TotalHeapBytes:F1}% do heap total");
        }

        if (summary.TotalObjectCount > 80000)
        {
            insights.Add($"Alto número de objetos no heap ({summary.TotalObjectCount:N0}) pode indicar necessidade de otimização");
        }

        if (summary.LohObjectCount > 80)
        {
            insights.Add($"Muitos objetos grandes detectados no LOH ({summary.LohObjectCount})");
        }

        if (topTypesByMemory.Length > 0)
        {
            var topType = topTypesByMemory[0];
            var typeInfo = topType.IsArray 
                ? $"{topType.TypeName} (array de {topType.ArrayElementType ?? "unknown"})"
                : topType.TypeName;
            insights.Add($"Tipo mais custoso: {typeInfo} ({topType.TotalBytes / (1024.0 * 1024.0):F2} MB, {topType.InstanceCount:N0} instâncias)");
        }

        // Insights sobre namespaces problemáticos
        var problematicNamespaces = topNamespaces.Where(ns => ns.IsProblematic).ToArray();
        if (problematicNamespaces.Length > 0)
        {
            foreach (var ns in problematicNamespaces.Take(3))
            {
                insights.Add($"⚠️ Namespace problemático: {ns.Namespace} ({ns.TotalBytes / (1024.0 * 1024.0):F2} MB, {ns.InstanceCount:N0} objetos) - Verificar Repository/Service/UseCase");
            }
        }

        // Insights sobre arrays
        if (topArrayElements.Length > 0)
        {
            var topArray = topArrayElements[0];
            if (topArray.TotalBytes > 10_000_000) // > 10MB
            {
                insights.Add($"⚠️ Muitos arrays de {topArray.ElementTypeName}: {topArray.TotalArrays:N0} arrays ocupando {topArray.TotalBytes / (1024.0 * 1024.0):F2} MB");
            }
        }

        // Insights sobre threads
        if (threadAnalysis.TotalThreads > 50)
        {
            insights.Add($"⚠️ Alto número de threads ({threadAnalysis.TotalThreads}) - possível thread leak");
        }

        if (threadAnalysis.TaskObjectsCount > 1000)
        {
            insights.Add($"⚠️ Muitos objetos Task no heap ({threadAnalysis.TaskObjectsCount:N0}) - verificar async/await não aguardados");
        }

        if (threadAnalysis.ThreadObjectsBytes > 10_000_000) // > 10MB
        {
            insights.Add($"⚠️ Objetos relacionados a threads ocupando {threadAnalysis.ThreadObjectsBytes / (1024.0 * 1024.0):F2} MB");
        }

        insights.Add($"Heap contém {summary.TotalTypeCount} tipos diferentes de objetos");
        insights.Add($"Total de {summary.TotalObjectCount:N0} objetos alocados");

        return insights.ToArray();
    }

    private static string ExtractNamespace(string typeName)
    {
        if (string.IsNullOrEmpty(typeName)) return "<unknown>";
        
        // Remove parâmetros genéricos (ex: List`1 → List)
        var nameWithoutGenerics = typeName.Split('`')[0];
        
        // Remove parâmetros de tipo (ex: Dictionary`2[String,Int32] → Dictionary`2)
        var nameWithoutTypeParams = nameWithoutGenerics.Split('[')[0];
        
        // Extrai namespace (última parte antes do último ponto é o nome do tipo)
        var lastDot = nameWithoutTypeParams.LastIndexOf('.');
        if (lastDot == -1) return "<global>";
        
        return nameWithoutTypeParams.Substring(0, lastDot);
    }

    private static bool IsThreadRelated(string typeName)
    {
        if (string.IsNullOrEmpty(typeName)) return false;
        
        return typeName.StartsWith("System.Threading.Thread", StringComparison.Ordinal) ||
               typeName.StartsWith("System.Threading.Tasks.Task", StringComparison.Ordinal) ||
               typeName.Contains("ThreadPool", StringComparison.Ordinal) ||
               typeName.Contains("AsyncStateMachine", StringComparison.Ordinal) ||
               typeName.Contains("ThreadLocal", StringComparison.Ordinal);
    }

    private static bool IsProblematicNamespace(string ns, long totalBytes, long instanceCount)
    {
        if (string.IsNullOrEmpty(ns)) return false;
        
        var isProblematicArea = ns.Contains("Repository", StringComparison.OrdinalIgnoreCase) ||
                               ns.Contains("Service", StringComparison.OrdinalIgnoreCase) ||
                               ns.Contains("UseCase", StringComparison.OrdinalIgnoreCase) ||
                               ns.Contains("Handler", StringComparison.OrdinalIgnoreCase);
        
        // Considera problemático se é área crítica E tem alto uso
        return isProblematicArea && (totalBytes > 10_000_000 || instanceCount > 1000);
    }

    private class TypeStatistics
    {
        public string Namespace { get; set; } = string.Empty;
        public bool IsArray { get; set; }
        public string? ArrayElementType { get; set; }
        public bool IsThreadRelated { get; set; }
        public long TotalBytes { get; set; }
        public long InstanceCount { get; set; }
    }

    private class NamespaceStatistics
    {
        public string Namespace { get; set; } = string.Empty;
        public long TotalBytes { get; set; }
        public long InstanceCount { get; set; }
        public HashSet<string> Types { get; set; } = new();
        public Dictionary<string, (long bytes, long count)> TypeDetails { get; set; } = new();
    }

    private class ArrayElementStatistics
    {
        public string ElementTypeName { get; set; } = string.Empty;
        public string ArrayTypeName { get; set; } = string.Empty;
        public long TotalArrays { get; set; }
        public long TotalBytes { get; set; }
    }

    private class LargeObjectInfo
    {
        public string TypeName { get; set; } = string.Empty;
        public string Namespace { get; set; } = string.Empty;
        public bool IsArray { get; set; }
        public string? ArrayElementType { get; set; }
        public long SizeBytes { get; set; }
        public long InstanceCount { get; set; }
    }
}

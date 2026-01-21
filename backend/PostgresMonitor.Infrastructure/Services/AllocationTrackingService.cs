using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.Diagnostics.NETCore.Client;
using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Parsers.Clr;
using Microsoft.Extensions.Logging;

namespace PostgresMonitor.Infrastructure.Services;

/// <summary>
/// Representa um stack trace de alocação capturado
/// </summary>
public readonly record struct AllocationStackTrace(
    string TypeName,
    string MethodName,
    string? ClassName,
    string? Namespace,
    string? FileName,
    int? LineNumber,
    string[] StackFrames
);

public sealed class AllocationTrackingService
{
    private readonly ILogger<AllocationTrackingService> _logger;
    private readonly ConcurrentDictionary<int, TrackingSession> _activeSessions = new();

    public AllocationTrackingService(ILogger<AllocationTrackingService> logger)
    {
        _logger = logger;
    }

    public async Task<bool> StartTrackingAsync(int processId, CancellationToken cancellationToken = default)
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
                    return false;
                }
            }
            catch (ArgumentException)
            {
                _logger.LogWarning("Processo {ProcessId} não encontrado", processId);
                return false;
            }

            // Verificar se já existe uma sessão ativa
            if (_activeSessions.ContainsKey(processId))
            {
                _logger.LogWarning("Rastreamento já está ativo para o processo {ProcessId}", processId);
                return false;
            }

            return await Task.Run(() => StartTrackingInternal(processId, cancellationToken), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao iniciar rastreamento para processo {ProcessId}", processId);
            return false;
        }
    }

    private bool StartTrackingInternal(int processId, CancellationToken cancellationToken)
    {
        try
        {
            var diagnosticsClient = new DiagnosticsClient(processId);

            // Configurar providers para capturar alocações
            var providers = new List<EventPipeProvider>
            {
                new EventPipeProvider(
                    "Microsoft-Windows-DotNETRuntime",
                    System.Diagnostics.Tracing.EventLevel.Verbose,
                    (long)(ClrTraceEventParser.Keywords.GCSampledObjectAllocationHigh |
                           ClrTraceEventParser.Keywords.GCHeapAndTypeNames |
                           ClrTraceEventParser.Keywords.Stack))
            };

            var session = diagnosticsClient.StartEventPipeSession(providers, requestRundown: false, circularBufferMB: 256);
            if (session == null)
            {
                _logger.LogError("Não foi possível iniciar sessão EventPipe para processo {ProcessId}", processId);
                return false;
            }

            var trackingSession = new TrackingSession
            {
                ProcessId = processId,
                EventPipeSession = session,
                StartTime = DateTime.UtcNow,
                AllocationStacks = new ConcurrentDictionary<string, List<AllocationStackTrace>>()
            };

            // Iniciar thread para processar eventos
            var cts = new CancellationTokenSource();
            trackingSession.CancellationTokenSource = cts;

            _ = Task.Run(() => ProcessEventsAsync(trackingSession, cts.Token), cts.Token);

            _activeSessions.TryAdd(processId, trackingSession);
            _logger.LogInformation("Rastreamento iniciado para processo {ProcessId}", processId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao iniciar rastreamento interno para processo {ProcessId}", processId);
            return false;
        }
    }

    private Task ProcessEventsAsync(TrackingSession session, CancellationToken cancellationToken)
    {
        return Task.Run(() =>
        {
            try
            {
                using var source = new EventPipeEventSource(session.EventPipeSession.EventStream);
                var clrParser = new ClrTraceEventParser(source);

                // Registrar handler para eventos de alocação
                clrParser.GCSampledObjectAllocation += (GCSampledObjectAllocationTraceData data) =>
                {
                    if (cancellationToken.IsCancellationRequested)
                        return;

                    ProcessAllocationEvent(data, session);
                };

                // Processar eventos (bloqueia até cancelar ou stream terminar)
                source.Process();
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Processamento de eventos cancelado para processo {ProcessId}", session.ProcessId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar eventos para processo {ProcessId}", session.ProcessId);
            }
        }, cancellationToken);
    }

    private void ProcessAllocationEvent(TraceEvent data, TrackingSession session)
    {
        try
        {
            var typeName = data.PayloadByName("TypeName")?.ToString() ?? "Unknown";
            
            // Obter stack trace básico
            var stackFrames = new List<string>();
            string? methodName = null;
            string? className = null;
            string? namespaceName = null;
            string? fileName = null;
            int? lineNumber = null;

            // Tentar obter informações básicas do evento
            // Nota: Stack traces completos requerem símbolos e configuração adicional
            if (!string.IsNullOrEmpty(data.ProcessName))
            {
                stackFrames.Add($"Process: {data.ProcessName}");
            }

            var stackTrace = new AllocationStackTrace(
                TypeName: typeName,
                MethodName: methodName ?? "Unknown",
                ClassName: className,
                Namespace: namespaceName,
                FileName: fileName,
                LineNumber: lineNumber,
                StackFrames: stackFrames.ToArray()
            );

            // Armazenar por tipo (limitar a top 100 por tipo para evitar uso excessivo de memória)
            session.AllocationStacks.AddOrUpdate(
                typeName,
                new List<AllocationStackTrace> { stackTrace },
                (key, existing) =>
                {
                    if (existing.Count < 100)
                    {
                        existing.Add(stackTrace);
                    }
                    return existing;
                });

            Interlocked.Increment(ref session.EventCount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao processar evento de alocação");
        }
    }

    public async Task<bool> StopTrackingAsync(int processId, CancellationToken cancellationToken = default)
    {
        if (!_activeSessions.TryRemove(processId, out var session))
        {
            _logger.LogWarning("Nenhuma sessão ativa encontrada para processo {ProcessId}", processId);
            return false;
        }

        try
        {
            session.CancellationTokenSource?.Cancel();
            session.EventPipeSession?.Stop();

            await Task.Delay(100, cancellationToken); // Dar tempo para finalizar

            session.EventPipeSession?.Dispose();
            session.CancellationTokenSource?.Dispose();

            _logger.LogInformation(
                "Rastreamento parado para processo {ProcessId}. Eventos capturados: {EventCount}",
                processId,
                session.EventCount);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao parar rastreamento para processo {ProcessId}", processId);
            return false;
        }
    }

    public Task<bool> IsTrackingActiveAsync(int processId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_activeSessions.ContainsKey(processId));
    }

    public Task<Dictionary<string, List<AllocationStackTrace>>> GetAllocationStacksAsync(
        int processId,
        string? typeNameFilter = null,
        CancellationToken cancellationToken = default)
    {
        if (!_activeSessions.TryGetValue(processId, out var session))
        {
            return Task.FromResult(new Dictionary<string, List<AllocationStackTrace>>());
        }

        var result = new Dictionary<string, List<AllocationStackTrace>>();

        foreach (var kvp in session.AllocationStacks)
        {
            if (typeNameFilter == null || kvp.Key.Contains(typeNameFilter, StringComparison.OrdinalIgnoreCase))
            {
                result[kvp.Key] = new List<AllocationStackTrace>(kvp.Value);
            }
        }

        return Task.FromResult(result);
    }

    public Task ClearTrackingDataAsync(int processId, CancellationToken cancellationToken = default)
    {
        if (_activeSessions.TryGetValue(processId, out var session))
        {
            session.AllocationStacks.Clear();
            Interlocked.Exchange(ref session.EventCount, 0);
            _logger.LogInformation("Dados de rastreamento limpos para processo {ProcessId}", processId);
        }

        return Task.CompletedTask;
    }

    private class TrackingSession
    {
        public int ProcessId { get; set; }
        public EventPipeSession EventPipeSession { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public ConcurrentDictionary<string, List<AllocationStackTrace>> AllocationStacks { get; set; } = new();
        public CancellationTokenSource? CancellationTokenSource { get; set; }
        public int EventCount;
    }
}

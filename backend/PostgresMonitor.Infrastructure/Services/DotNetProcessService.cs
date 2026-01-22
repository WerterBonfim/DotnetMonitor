using System.Diagnostics;
using System.IO;
using PostgresMonitor.Core.DTOs;
using PostgresMonitor.Core.Services;

namespace PostgresMonitor.Infrastructure.Services;

public sealed class DotNetProcessService
{
    public Task<IEnumerable<DotNetProcessDto>> GetDotNetProcessesAsync(CancellationToken cancellationToken = default)
    {
        var processes = new List<DotNetProcessDto>();
        var logPath = @"c:\Users\werter-dev\dev\projetos\DotnetMonitor\.cursor\debug.log";

        try
        {
            var allProcesses = Process.GetProcesses();
            
            // #region agent log
            try
            {
                var logEntry = $"{{\"location\":\"DotNetProcessService.cs:GetDotNetProcessesAsync\",\"message\":\"Iniciando busca de processos\",\"data\":{{\"totalProcesses\":{allProcesses.Length}}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\"}}\n";
                File.AppendAllText(logPath, logEntry);
            }
            catch { }
            // #endregion

            foreach (var process in allProcesses)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                try
                {
                    var processName = process.ProcessName.ToLowerInvariant();
                    
                    // #region agent log
                    try
                    {
                        var logEntry = $"{{\"location\":\"DotNetProcessService.cs:GetDotNetProcessesAsync\",\"message\":\"Verificando processo\",\"data\":{{\"processId\":{process.Id},\"processName\":\"{process.ProcessName}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\"}}\n";
                        File.AppendAllText(logPath, logEntry);
                    }
                    catch { }
                    // #endregion

                    // Filtro otimizado: pula apenas processos conhecidos que NÃO são .NET
                    // Isso permite que apps .NET self-contained sejam verificados pelo MainModule
                    var knownNonDotNet = processName.Contains("chrome") || 
                                        processName.Contains("firefox") ||
                                        processName.Contains("edge") ||
                                        processName.Contains("explorer") ||
                                        processName.Contains("winlogon") ||
                                        processName.Contains("csrss") ||
                                        processName.Contains("svchost") ||
                                        processName.Contains("dwm") ||
                                        processName.Contains("audiodg");
                    
                    if (knownNonDotNet)
                    {
                        continue; // Pula processos conhecidos que não são .NET
                    }

                    // Verifica se é um processo .NET (método otimizado)
                    var isDotNet = IsDotNetProcessFast(process);
                    
                    // #region agent log
                    try
                    {
                        var logEntry = $"{{\"location\":\"DotNetProcessService.cs:GetDotNetProcessesAsync\",\"message\":\"Resultado verificação .NET\",\"data\":{{\"processId\":{process.Id},\"processName\":\"{process.ProcessName}\",\"isDotNet\":{isDotNet.ToString().ToLower()}}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"B\"}}\n";
                        File.AppendAllText(logPath, logEntry);
                    }
                    catch { }
                    // #endregion

                    if (isDotNet)
                    {
                        var dto = new DotNetProcessDto(
                            ProcessId: process.Id,
                            ProcessName: process.ProcessName,
                            MainModulePath: GetMainModulePathSafe(process),
                            WorkingSet64: process.WorkingSet64,
                            StartTime: process.StartTime
                        );
                        
                        processes.Add(dto);
                    }
                }
                catch (Exception ex)
                {
                    // #region agent log
                    try
                    {
                        var logEntry = $"{{\"location\":\"DotNetProcessService.cs:GetDotNetProcessesAsync\",\"message\":\"Erro ao processar processo\",\"data\":{{\"processId\":{process.Id},\"error\":\"{ex.Message}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}}\n";
                        File.AppendAllText(logPath, logEntry);
                    }
                    catch { }
                    // #endregion
                    // Ignora processos que não podem ser acessados
                    continue;
                }
            }

            // #region agent log
            try
            {
                var logEntry = $"{{\"location\":\"DotNetProcessService.cs:GetDotNetProcessesAsync\",\"message\":\"Busca concluída\",\"data\":{{\"totalFound\":{processes.Count},\"processIds\":[{string.Join(",", processes.Select(p => p.ProcessId))}]}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"D\"}}\n";
                File.AppendAllText(logPath, logEntry);
            }
            catch { }
            // #endregion
        }
        catch (Exception ex)
        {
            // #region agent log
            try
            {
                var logEntry = $"{{\"location\":\"DotNetProcessService.cs:GetDotNetProcessesAsync\",\"message\":\"Erro geral\",\"data\":{{\"error\":\"{ex.Message}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"E\"}}\n";
                File.AppendAllText(logPath, logEntry);
            }
            catch { }
            // #endregion
            // Retorna lista vazia em caso de erro
        }

        return Task.FromResult<IEnumerable<DotNetProcessDto>>(processes);
    }

    public Task<DotNetProcessDto?> GetProcessByIdAsync(int processId, CancellationToken cancellationToken = default)
    {
        try
        {
            var process = Process.GetProcessById(processId);
            
            if (!IsDotNetProcess(process))
            {
                return Task.FromResult<DotNetProcessDto?>(null);
            }

            var dto = new DotNetProcessDto(
                ProcessId: process.Id,
                ProcessName: process.ProcessName,
                MainModulePath: GetMainModulePathSafe(process),
                WorkingSet64: process.WorkingSet64,
                StartTime: process.StartTime
            );

            return Task.FromResult<DotNetProcessDto?>(dto);
        }
        catch (Exception)
        {
            return Task.FromResult<DotNetProcessDto?>(null);
        }
    }

    private static bool IsDotNetProcessFast(Process process)
    {
        var logPath = @"c:\Users\werter-dev\dev\projetos\DotnetMonitor\.cursor\debug.log";
        
        try
        {
            // Verifica primeiro pelo nome do processo (mais rápido)
            var processName = process.ProcessName.ToLowerInvariant();
            if (processName.Contains("dotnet") || 
                processName.Contains("w3wp") || // IIS
                processName.Contains("iisexpress") ||
                processName.Contains("vbcsc") || // Visual Basic Compiler
                processName.Contains("csc")) // C# Compiler
            {
                // #region agent log
                try
                {
                    var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Processo .NET detectado por nome\",\"data\":{{\"processId\":{process.Id},\"processName\":\"{process.ProcessName}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"F\"}}\n";
                    File.AppendAllText(logPath, logEntry);
                }
                catch { }
                // #endregion
                return true;
            }

            // Tenta verificar pelo MainModule (mais rápido que Modules, mas ainda pode ser lento)
            // Usa timeout implícito através de try-catch rápido
            try
            {
                var mainModule = process.MainModule;
                if (mainModule != null && mainModule.FileName != null)
                {
                    var fileName = mainModule.FileName.ToLowerInvariant();
                    
                    // #region agent log
                    try
                    {
                        var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Verificando MainModule\",\"data\":{{\"processId\":{process.Id},\"fileName\":\"{fileName}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"G\"}}\n";
                        File.AppendAllText(logPath, logEntry);
                    }
                    catch { }
                    // #endregion
                    
                    // Verifica se contém DLLs do .NET Runtime
                    if (fileName.Contains("dotnet") || 
                        fileName.Contains("clr.dll") ||
                        fileName.Contains("coreclr.dll") ||
                        fileName.Contains("mscorlib"))
                    {
                        // #region agent log
                        try
                        {
                            var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Processo .NET detectado por MainModule\",\"data\":{{\"processId\":{process.Id},\"fileName\":\"{fileName}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"H\"}}\n";
                            File.AppendAllText(logPath, logEntry);
                        }
                        catch { }
                        // #endregion
                        return true;
                    }
                    
                    // Verifica se o executável tem dependências do .NET Runtime
                    // Para apps self-contained, verificamos se há arquivos .dll do runtime no mesmo diretório
                    var exeDir = Path.GetDirectoryName(fileName);
                    if (!string.IsNullOrEmpty(exeDir) && Directory.Exists(exeDir))
                    {
                        var runtimeFiles = Directory.GetFiles(exeDir, "*.dll", SearchOption.TopDirectoryOnly)
                            .Any(f => Path.GetFileName(f).ToLowerInvariant().Contains("coreclr") ||
                                      Path.GetFileName(f).ToLowerInvariant().Contains("clr") ||
                                      Path.GetFileName(f).ToLowerInvariant().Contains("mscorlib"));
                        
                        if (runtimeFiles)
                        {
                            // #region agent log
                            try
                            {
                                var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Processo .NET detectado por DLLs no diretório\",\"data\":{{\"processId\":{process.Id},\"exeDir\":\"{exeDir}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"I\"}}\n";
                                File.AppendAllText(logPath, logEntry);
                            }
                            catch { }
                            // #endregion
                            return true;
                        }
                    }
                    
                    // Última tentativa: verifica módulos carregados pelo processo
                    // Isso é mais lento, mas detecta apps .NET self-contained que não têm DLLs no diretório
                    try
                    {
                        var modules = process.Modules;
                        foreach (ProcessModule? module in modules)
                        {
                            if (module?.FileName == null) continue;
                            
                            var moduleName = Path.GetFileName(module.FileName).ToLowerInvariant();
                            if (moduleName.Contains("coreclr.dll") ||
                                moduleName.Contains("clr.dll") ||
                                moduleName.Contains("mscorlib.dll") ||
                                moduleName.Contains("system.runtime.dll") ||
                                moduleName.Contains("system.private.corelib.dll"))
                            {
                                // #region agent log
                                try
                                {
                                    var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Processo .NET detectado por módulos carregados\",\"data\":{{\"processId\":{process.Id},\"moduleName\":\"{moduleName}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"M\"}}\n";
                                    File.AppendAllText(logPath, logEntry);
                                }
                                catch { }
                                // #endregion
                                return true;
                            }
                        }
                    }
                    catch
                    {
                        // Se não conseguir acessar módulos, continua
                    }
                }
            }
            catch (Exception ex)
            {
                // #region agent log
                try
                {
                    var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Erro ao acessar MainModule\",\"data\":{{\"processId\":{process.Id},\"error\":\"{ex.Message}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"J\"}}\n";
                    File.AppendAllText(logPath, logEntry);
                }
                catch { }
                // #endregion
                // Se MainModule falhar, não tenta Modules (muito lento)
                return false;
            }
        }
        catch (Exception ex)
        {
            // #region agent log
            try
            {
                var logEntry = $"{{\"location\":\"DotNetProcessService.cs:IsDotNetProcessFast\",\"message\":\"Erro geral na verificação\",\"data\":{{\"processId\":{process.Id},\"error\":\"{ex.Message}\"}},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"K\"}}\n";
                File.AppendAllText(logPath, logEntry);
            }
            catch { }
            // #endregion
            // Ignora erros de acesso
        }

        return false;
    }

    private static bool IsDotNetProcess(Process process)
    {
        return IsDotNetProcessFast(process);
    }

    private static string? GetMainModulePathSafe(Process process)
    {
        try
        {
            return process.MainModule?.FileName;
        }
        catch
        {
            return null;
        }
    }
}

using System.Diagnostics;
using PostgresMonitor.Core.DTOs;
using PostgresMonitor.Core.Services;

namespace PostgresMonitor.Infrastructure.Services;

public sealed class DotNetProcessService
{
    public Task<IEnumerable<DotNetProcessDto>> GetDotNetProcessesAsync(CancellationToken cancellationToken = default)
    {
        var processes = new List<DotNetProcessDto>();

        try
        {
            var allProcesses = Process.GetProcesses();
            
            foreach (var process in allProcesses)
            {
                try
                {
                    // Verifica se é um processo .NET
                    if (IsDotNetProcess(process))
                    {
                        var dto = new DotNetProcessDto(
                            ProcessId: process.Id,
                            ProcessName: process.ProcessName,
                            MainModulePath: GetMainModulePath(process),
                            WorkingSet64: process.WorkingSet64,
                            StartTime: process.StartTime
                        );
                        
                        processes.Add(dto);
                    }
                }
                catch (Exception)
                {
                    // Ignora processos que não podem ser acessados
                    continue;
                }
            }
        }
        catch (Exception)
        {
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
                MainModulePath: GetMainModulePath(process),
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

    private static bool IsDotNetProcess(Process process)
    {
        try
        {
            // Verifica se o processo tem módulos .NET
            var modules = process.Modules;
            foreach (ProcessModule? module in modules)
            {
                if (module == null) continue;
                
                var moduleName = module.ModuleName?.ToLowerInvariant() ?? string.Empty;
                
                // Verifica por DLLs comuns do .NET
                if (moduleName.Contains("clr.dll") ||
                    moduleName.Contains("coreclr.dll") ||
                    moduleName.Contains("dotnet") ||
                    moduleName.Contains("mscorlib") ||
                    moduleName.Contains("System."))
                {
                    return true;
                }
            }
        }
        catch
        {
            // Se não conseguir acessar módulos, tenta outra abordagem
        }

        // Verifica pelo nome do processo
        var processName = process.ProcessName.ToLowerInvariant();
        if (processName.Contains("dotnet") || 
            processName.EndsWith(".exe") && processName.Contains("dotnet"))
        {
            return true;
        }

        return false;
    }

    private static string? GetMainModulePath(Process process)
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

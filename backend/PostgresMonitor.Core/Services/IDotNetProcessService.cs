using PostgresMonitor.Core.DTOs;

namespace PostgresMonitor.Core.Services;

public interface IDotNetProcessService
{
    Task<IEnumerable<DotNetProcessDto>> GetDotNetProcessesAsync(CancellationToken cancellationToken = default);
    Task<DotNetProcessDto?> GetProcessByIdAsync(int processId, CancellationToken cancellationToken = default);
}

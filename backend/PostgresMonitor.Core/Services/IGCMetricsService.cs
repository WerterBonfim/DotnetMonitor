using PostgresMonitor.Core.DTOs;

namespace PostgresMonitor.Core.Services;

public interface IGCMetricsService
{
    Task<GCStatsDto?> GetGCMetricsAsync(int processId, CancellationToken cancellationToken = default);
}

using PostgresMonitor.Core.DTOs;

namespace PostgresMonitor.Core.Services;

public interface IHeapAnalysisService
{
    Task<HeapAnalysisDto?> GetHeapAnalysisAsync(int processId, int topN = 10, bool includeAllocationStacks = false, CancellationToken cancellationToken = default);
}

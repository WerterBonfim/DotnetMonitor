using PostgresMonitor.Infrastructure.Services;

namespace PostgresMonitor.Api.Endpoints.GC.Metrics;

public static class MetricsEndpoints
{
    public static WebApplication MapGCMetricsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/gc/metrics")
            .WithTags("GC Metrics");

        group.MapGet("/{processId}", async (
            int processId,
            GCMetricsService gcMetricsService) =>
        {
            var metrics = await gcMetricsService.GetGCMetricsAsync(processId);
            if (metrics == null)
                return Results.NotFound($"Processo {processId} não encontrado ou não é um processo .NET");

            var response = new
            {
                gen0 = new
                {
                    metrics.Value.Gen0.SizeAfterBytes,
                    metrics.Value.Gen0.FragmentedBytes,
                    metrics.Value.Gen0.FragmentationPercent,
                    metrics.Value.Gen0.CollectionCount
                },
                gen1 = new
                {
                    metrics.Value.Gen1.SizeAfterBytes,
                    metrics.Value.Gen1.FragmentedBytes,
                    metrics.Value.Gen1.FragmentationPercent,
                    metrics.Value.Gen1.CollectionCount
                },
                gen2 = new
                {
                    metrics.Value.Gen2.SizeAfterBytes,
                    metrics.Value.Gen2.FragmentedBytes,
                    metrics.Value.Gen2.FragmentationPercent,
                    metrics.Value.Gen2.CollectionCount
                },
                lohSizeBytes = metrics.Value.LohSizeBytes,
                pohSizeBytes = metrics.Value.PohSizeBytes,
                totalMemoryBytes = metrics.Value.TotalMemoryBytes,
                availableMemoryBytes = metrics.Value.AvailableMemoryBytes,
                pinnedObjectsCount = metrics.Value.PinnedObjectsCount,
                overallFragmentationPercent = metrics.Value.OverallFragmentationPercent,
                healthStatus = metrics.Value.HealthStatus,
                interpretation = new
                {
                    metrics.Value.Interpretation.Status,
                    metrics.Value.Interpretation.Description,
                    metrics.Value.Interpretation.Recommendations,
                    metrics.Value.Interpretation.CurrentIssues
                },
                recentCollections = metrics.Value.RecentCollections.Select(c => new
                {
                    c.Generation,
                    c.Timestamp,
                    c.HeapSizeBytes,
                    c.MemoryFreedBytes
                }),
                timestamp = metrics.Value.Timestamp,
                timeInGCPercent = metrics.Value.TimeInGCPercent,
                gcPauseTimeTotalMs = metrics.Value.GCPauseTimeTotalMs,
                gcPauseTimeAverageMs = metrics.Value.GCPauseTimeAverageMs,
                collectionRatePerMinute = new
                {
                    gen0 = metrics.Value.CollectionRatePerMinute.Gen0,
                    gen1 = metrics.Value.CollectionRatePerMinute.Gen1,
                    gen2 = metrics.Value.CollectionRatePerMinute.Gen2
                },
                allocationRateBytesPerSecond = metrics.Value.AllocationRateBytesPerSecond,
                memoryCommittedSizeBytes = metrics.Value.MemoryCommittedSizeBytes,
                heapSizeAfterGen2GC = metrics.Value.HeapSizeAfterGen2GC,
                gen2CollectionFrequencyPerHour = metrics.Value.Gen2CollectionFrequencyPerHour
            };

            return Results.Ok(response);
        })
        .WithName("GetGCMetrics");

        return app;
    }
}

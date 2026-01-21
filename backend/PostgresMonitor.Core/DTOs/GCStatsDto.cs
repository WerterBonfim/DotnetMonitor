namespace PostgresMonitor.Core.DTOs;

public readonly record struct GenerationInfoDto(
    long SizeAfterBytes,
    long FragmentedBytes,
    double FragmentationPercent,
    long CollectionCount
);

public readonly record struct GCCollectionEventDto(
    int Generation,
    DateTime Timestamp,
    long HeapSizeBytes,
    long MemoryFreedBytes
);

public readonly record struct GCInterpretationDto(
    string Status,
    string Description,
    string[] Recommendations,
    string[] CurrentIssues
);

public readonly record struct CollectionRatePerMinuteDto(
    double Gen0,
    double Gen1,
    double Gen2
);

public readonly record struct GCStatsDto(
    GenerationInfoDto Gen0,
    GenerationInfoDto Gen1,
    GenerationInfoDto Gen2,
    long LohSizeBytes,
    long PohSizeBytes,
    long TotalMemoryBytes,
    long AvailableMemoryBytes,
    int PinnedObjectsCount,
    double OverallFragmentationPercent,
    string HealthStatus,
    GCInterpretationDto Interpretation,
    GCCollectionEventDto[] RecentCollections,
    DateTime Timestamp,
    double TimeInGCPercent,
    double GCPauseTimeTotalMs,
    double GCPauseTimeAverageMs,
    CollectionRatePerMinuteDto CollectionRatePerMinute,
    long AllocationRateBytesPerSecond,
    long MemoryCommittedSizeBytes,
    long HeapSizeAfterGen2GC,
    double Gen2CollectionFrequencyPerHour
);

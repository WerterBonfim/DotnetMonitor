namespace PostgresMonitor.Core.DTOs;

public readonly record struct AllocationOriginDto(
    string TypeName,
    string MethodName,
    string? ClassName,
    string? Namespace,
    string? FileName,
    int? LineNumber,
    string[] StackFrames,
    int AllocationCount
);

public readonly record struct TypeMemoryInfoDto(
    string TypeName,
    string Namespace,
    bool IsArray,
    string? ArrayElementType,
    bool IsThreadRelated,
    long TotalBytes,
    long InstanceCount,
    double AverageBytesPerInstance,
    double PercentageOfTotal,
    AllocationOriginDto[]? AllocationOrigins
);

public readonly record struct TypeCountInfoDto(
    string TypeName,
    string Namespace,
    bool IsArray,
    string? ArrayElementType,
    bool IsThreadRelated,
    long InstanceCount,
    long TotalBytes,
    double PercentageOfTotalCount
);

public readonly record struct LargeObjectInfoDto(
    string TypeName,
    string Namespace,
    bool IsArray,
    string? ArrayElementType,
    long SizeBytes,
    long InstanceCount
);

public readonly record struct NamespaceStatsDto(
    string Namespace,
    long TotalBytes,
    long InstanceCount,
    int TypeCount,
    TypeMemoryInfoDto[] TopTypes,
    bool IsProblematic,
    string[]? TopAllocationMethods
);

public readonly record struct ArrayElementStatsDto(
    string ElementTypeName,
    string ArrayTypeName,
    long TotalArrays,
    long TotalBytes,
    double AverageArraySize
);

public readonly record struct ThreadAnalysisDto(
    int TotalThreads,
    long ThreadObjectsCount,
    long ThreadObjectsBytes,
    long TaskObjectsCount,
    long TaskObjectsBytes
);

public readonly record struct HeapSummaryDto(
    long TotalHeapBytes,
    long TotalObjectCount,
    int TotalTypeCount,
    long LohBytes,
    long LohObjectCount
);

public readonly record struct HeapAnalysisDto(
    string Id,
    DateTime Timestamp,
    TypeMemoryInfoDto[] TopTypesByMemory,
    TypeCountInfoDto[] TopTypesByCount,
    LargeObjectInfoDto[] LargeObjects,
    NamespaceStatsDto[] TopNamespacesByMemory,
    ArrayElementStatsDto[] TopArrayElements,
    ThreadAnalysisDto ThreadAnalysis,
    HeapSummaryDto Summary,
    string[] HumanizedInsights
);

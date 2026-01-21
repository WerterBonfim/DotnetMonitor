namespace PostgresMonitor.Core.DTOs;

public readonly record struct DotNetProcessDto(
    int ProcessId,
    string ProcessName,
    string? MainModulePath,
    long WorkingSet64,
    DateTime StartTime
);

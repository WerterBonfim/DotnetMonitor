namespace PostgresMonitor.Core.Services;

public interface IAllocationTrackingService
{
    /// <summary>
    /// Inicia o rastreamento de alocações para um processo específico usando EventPipe
    /// </summary>
    Task<bool> StartTrackingAsync(int processId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Para o rastreamento de alocações para um processo específico
    /// </summary>
    Task<bool> StopTrackingAsync(int processId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém o status do rastreamento (ativo/inativo)
    /// </summary>
    Task<bool> IsTrackingActiveAsync(int processId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém os stack traces de alocação capturados para um tipo específico
    /// </summary>
    Task<Dictionary<string, List<AllocationStackTrace>>> GetAllocationStacksAsync(
        int processId, 
        string? typeNameFilter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Limpa os dados de rastreamento para um processo
    /// </summary>
    Task ClearTrackingDataAsync(int processId, CancellationToken cancellationToken = default);
}

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

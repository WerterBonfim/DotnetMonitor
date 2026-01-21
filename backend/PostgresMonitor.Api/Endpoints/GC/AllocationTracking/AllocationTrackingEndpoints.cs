using PostgresMonitor.Infrastructure.Services;

namespace PostgresMonitor.Api.Endpoints.GC.AllocationTracking;

public static class AllocationTrackingEndpoints
{
    public static WebApplication MapGCAllocationTrackingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/gc/allocation-tracking")
            .WithTags("GC Allocation Tracking");

        group.MapPost("/start/{processId}", async (
            int processId,
            AllocationTrackingService trackingService) =>
        {
            var started = await trackingService.StartTrackingAsync(processId);
            if (!started)
                return Results.BadRequest($"Não foi possível iniciar rastreamento para processo {processId}");

            return Results.Ok(new { processId, status = "started", message = "Rastreamento iniciado com sucesso" });
        })
        .WithName("StartAllocationTracking");

        group.MapPost("/stop/{processId}", async (
            int processId,
            AllocationTrackingService trackingService) =>
        {
            var stopped = await trackingService.StopTrackingAsync(processId);
            if (!stopped)
                return Results.BadRequest($"Nenhum rastreamento ativo encontrado para processo {processId}");

            return Results.Ok(new { processId, status = "stopped", message = "Rastreamento parado com sucesso" });
        })
        .WithName("StopAllocationTracking");

        group.MapGet("/status/{processId}", async (
            int processId,
            AllocationTrackingService trackingService) =>
        {
            var isActive = await trackingService.IsTrackingActiveAsync(processId);
            return Results.Ok(new { processId, isActive, status = isActive ? "active" : "inactive" });
        })
        .WithName("GetAllocationTrackingStatus");

        return app;
    }
}

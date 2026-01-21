using PostgresMonitor.Infrastructure.Services;

namespace PostgresMonitor.Api.Endpoints.GC.Processes;

public static class ProcessesEndpoints
{
    public static WebApplication MapGCProcessesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/gc/processes")
            .WithTags("GC Processes");

        group.MapGet("", async (DotNetProcessService processService) =>
        {
            var processes = await processService.GetDotNetProcessesAsync();
            var response = processes.Select(p => new
            {
                p.ProcessId,
                p.ProcessName,
                p.MainModulePath,
                p.WorkingSet64,
                p.StartTime
            });
            return Results.Ok(response);
        })
        .WithName("GetDotNetProcesses");

        group.MapGet("/{processId}", async (
            int processId,
            DotNetProcessService processService) =>
        {
            var process = await processService.GetProcessByIdAsync(processId);
            if (process == null)
                return Results.NotFound();

            return Results.Ok(new
            {
                process.Value.ProcessId,
                process.Value.ProcessName,
                process.Value.MainModulePath,
                process.Value.WorkingSet64,
                process.Value.StartTime
            });
        })
        .WithName("GetDotNetProcess");

        return app;
    }
}

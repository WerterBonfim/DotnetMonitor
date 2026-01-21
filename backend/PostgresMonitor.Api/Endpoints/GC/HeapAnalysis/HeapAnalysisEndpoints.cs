using PostgresMonitor.Infrastructure.Services;

namespace PostgresMonitor.Api.Endpoints.GC.HeapAnalysis;

public static class HeapAnalysisEndpoints
{
    public static WebApplication MapGCHeapAnalysisEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/gc/heap-analysis")
            .WithTags("GC Heap Analysis");

        group.MapGet("/{processId}", async (
            int processId,
            HeapAnalysisService heapAnalysisService,
            int? topN = 10,
            bool? includeAllocationStacks = false) =>
        {
            var analysis = await heapAnalysisService.GetHeapAnalysisAsync(processId, topN ?? 10, includeAllocationStacks ?? false);
            if (analysis == null)
                return Results.NotFound($"Processo {processId} não encontrado ou não é um processo .NET");

            var response = new
            {
                analysis.Value.Id,
                analysis.Value.Timestamp,
                topTypesByMemory = analysis.Value.TopTypesByMemory.Select(t => new
                {
                    t.TypeName,
                    t.Namespace,
                    t.IsArray,
                    t.ArrayElementType,
                    t.IsThreadRelated,
                    t.TotalBytes,
                    t.InstanceCount,
                    t.AverageBytesPerInstance,
                    t.PercentageOfTotal,
                    allocationOrigins = t.AllocationOrigins?.Select(o => new
                    {
                        o.TypeName,
                        o.MethodName,
                        o.ClassName,
                        o.Namespace,
                        o.FileName,
                        o.LineNumber,
                        o.StackFrames,
                        o.AllocationCount
                    })
                }),
                topTypesByCount = analysis.Value.TopTypesByCount.Select(t => new
                {
                    t.TypeName,
                    t.Namespace,
                    t.IsArray,
                    t.ArrayElementType,
                    t.IsThreadRelated,
                    t.InstanceCount,
                    t.TotalBytes,
                    t.PercentageOfTotalCount
                }),
                largeObjects = analysis.Value.LargeObjects.Select(l => new
                {
                    l.TypeName,
                    l.Namespace,
                    l.IsArray,
                    l.ArrayElementType,
                    l.SizeBytes,
                    l.InstanceCount
                }),
                topNamespacesByMemory = analysis.Value.TopNamespacesByMemory.Select(ns => new
                {
                    ns.Namespace,
                    ns.TotalBytes,
                    ns.InstanceCount,
                    ns.TypeCount,
                    ns.IsProblematic,
                    ns.TopAllocationMethods,
                    topTypes = ns.TopTypes.Select(t => new
                    {
                        t.TypeName,
                        t.Namespace,
                        t.IsArray,
                        t.ArrayElementType,
                        t.IsThreadRelated,
                        t.TotalBytes,
                        t.InstanceCount,
                        t.AverageBytesPerInstance,
                        t.PercentageOfTotal
                    })
                }),
                topArrayElements = analysis.Value.TopArrayElements.Select(a => new
                {
                    a.ElementTypeName,
                    a.ArrayTypeName,
                    a.TotalArrays,
                    a.TotalBytes,
                    a.AverageArraySize
                }),
                threadAnalysis = new
                {
                    analysis.Value.ThreadAnalysis.TotalThreads,
                    analysis.Value.ThreadAnalysis.ThreadObjectsCount,
                    analysis.Value.ThreadAnalysis.ThreadObjectsBytes,
                    analysis.Value.ThreadAnalysis.TaskObjectsCount,
                    analysis.Value.ThreadAnalysis.TaskObjectsBytes
                },
                summary = new
                {
                    analysis.Value.Summary.TotalHeapBytes,
                    analysis.Value.Summary.TotalObjectCount,
                    analysis.Value.Summary.TotalTypeCount,
                    analysis.Value.Summary.LohBytes,
                    analysis.Value.Summary.LohObjectCount
                },
                humanizedInsights = analysis.Value.HumanizedInsights
            };

            return Results.Ok(response);
        })
        .WithName("GetHeapAnalysis");

        return app;
    }
}

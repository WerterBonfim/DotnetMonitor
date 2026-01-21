using PostgresMonitor.Api.Endpoints.Connections;
using PostgresMonitor.Api.Endpoints.QueryHistory;
using PostgresMonitor.Api.Endpoints.PostgreSQLLogs;
using PostgresMonitor.Api.Endpoints.IndexDetails;
using PostgresMonitor.Api.Endpoints.TableDetails;
using PostgresMonitor.Api.Endpoints.IndexTypes;
using PostgresMonitor.Api.Endpoints.QueryPlan;
using PostgresMonitor.Api.Endpoints.Monitoring;
using PostgresMonitor.Api.Endpoints.GC.Processes;
using PostgresMonitor.Api.Endpoints.GC.Metrics;
using PostgresMonitor.Api.Endpoints.GC.HeapAnalysis;
using PostgresMonitor.Api.Endpoints.GC.AllocationTracking;
using PostgresMonitor.Infrastructure.Analysis;
using PostgresMonitor.Infrastructure.LiteDb;
using PostgresMonitor.Infrastructure.PostgreSQL;
using PostgresMonitor.Infrastructure.Repositories;
using PostgresMonitor.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services
builder.Services.AddValidation();
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// LiteDB - banco de dados local
builder.Services.AddSingleton<LiteDbContext>(serviceProvider =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var dbPath = configuration.GetValue<string>("LiteDB:DatabasePath");
    return new LiteDbContext(dbPath);
});

// Services
builder.Services.AddSingleton<CryptoService>();
builder.Services.AddScoped<QueryPlanService>();
builder.Services.AddScoped<QueryPlanAnalyzer>();
builder.Services.AddScoped<ConnectionRepository>();
builder.Services.AddSingleton<DotNetProcessService>();
builder.Services.AddSingleton<GCMetricsService>();
builder.Services.AddSingleton<AllocationTrackingService>();
builder.Services.AddSingleton<HeapAnalysisService>();
builder.Services.AddScoped<MonitoringService>();
builder.Services.AddScoped<HistoricalMetricsService>();
builder.Services.AddScoped<QueryHistoryService>();

builder.Services.AddLogging();

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseHttpsRedirection();

// Registrar endpoints por slice
app.MapConnectionsEndpoints();
app.MapQueryHistoryEndpoints();
app.MapPostgreSQLLogsEndpoints();
app.MapIndexDetailsEndpoints();
app.MapTableDetailsEndpoints();
app.MapIndexTypesEndpoints();
app.MapQueryPlanEndpoints();
app.MapMonitoringEndpoints();
app.MapGCProcessesEndpoints();
app.MapGCMetricsEndpoints();
app.MapGCHeapAnalysisEndpoints();
app.MapGCAllocationTrackingEndpoints();

app.Run();

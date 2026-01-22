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
using PostgresMonitor.Api.Endpoints.BackendLogs;
using PostgresMonitor.Infrastructure.Analysis;
using PostgresMonitor.Infrastructure.Helpers;
using PostgresMonitor.Infrastructure.LiteDb;
using PostgresMonitor.Infrastructure.Logging;
using PostgresMonitor.Infrastructure.PostgreSQL;
using PostgresMonitor.Infrastructure.Repositories;
using PostgresMonitor.Infrastructure.Services;
// Ler porta da variável de ambiente ou usar padrão
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
var portNumber = int.Parse(port);
var isRunningUnderAspire = Environment.GetEnvironmentVariable("ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL") != null;

// Verificar se a porta está disponível APENAS se não estiver rodando sob Aspire
// O Aspire gerencia automaticamente a alocação de portas
var isAvailable = true;
if (!isRunningUnderAspire)
{
    isAvailable = PortHelper.IsPortAvailable(portNumber);

    if (!isAvailable)
    {
        Console.Error.WriteLine($"ERRO: A porta {port} já está em uso. Verifique se há outra instância do aplicativo rodando.");
        Console.Error.WriteLine($"Tente usar uma porta diferente definindo a variável de ambiente PORT.");
        Environment.Exit(1);
    }
}

var builder = WebApplication.CreateBuilder(args);

// Configurar URL do servidor APENAS se não estiver rodando sob Aspire
// O Aspire gerencia as URLs automaticamente através do proxy de porta (dcpctrl)
if (!isRunningUnderAspire)
{
    var urls = $"http://localhost:{port}";
    builder.WebHost.UseUrls(urls);
}

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

// Logger provider customizado para armazenar logs em memória
var loggerProvider = new InMemoryLoggerProvider(maxLogs: 500);
builder.Services.AddSingleton(loggerProvider);
builder.Services.AddLogging(loggingBuilder =>
{
    loggingBuilder.AddProvider(loggerProvider);
});

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
// Desabilitar HTTPS redirection - o app Tauri usa HTTP local, não HTTPS
// app.UseHttpsRedirection(); // Comentado para evitar redirecionamento em ambiente local

app.UseExceptionHandler(appErr =>
{
    appErr.Run(async ctx =>
    {
        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        var ex = ctx.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        var obj = new { title = "Erro interno", detail = ex?.Message ?? "Erro desconhecido", type = ex?.GetType().Name ?? "Unknown" };
        await ctx.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(obj));
    });
});

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
app.MapBackendLogsEndpoints();

app.Run();

using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject("api", "../PostgresMonitor.Api/PostgresMonitor.Api.csproj");

var frontend = builder.AddExecutable("frontend", "npm", "../../front-app", "run", "dev", "--", "--host", "0.0.0.0")
    .WithHttpEndpoint(port: 5173, name: "http", env: "PORT")
    .WithReference(api)
    .WithEnvironment("VITE_API_BASE_URL", api.GetEndpoint("http"));

var app = builder.Build();

app.Run();

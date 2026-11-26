using Api.Data;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// The connection string is never in the source code: it comes from user secrets (development)
// or from the ConnectionStrings__Default environment variable. See the README.
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException(
        "Missing connection string: set ConnectionStrings:Default (see the README).");

builder.Services.AddDbContext<AppDbContext>(options => options.UseMySQL(connectionString));

// The clock is injected so that "today" (no attendance in the future) can be fixed in tests.
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Unhandled exceptions and bare status codes (404, 405...) answer with a ProblemDetails JSON body.
builder.Services.AddProblemDetails();

// GET /health checks that the API is up and that the database answers.
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

var app = builder.Build();

// On startup: create or update the schema (migrations), then insert the trainees if there are none yet.
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await TraineeSeeder.SeedAsync(db);
}

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapControllers();
app.MapHealthChecks("/health");

// Interactive API documentation to try the endpoints from the browser: http://localhost:5080/scalar
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.Run();

// Makes the entry point visible to WebApplicationFactory<Program> in Api.Tests.
public partial class Program;

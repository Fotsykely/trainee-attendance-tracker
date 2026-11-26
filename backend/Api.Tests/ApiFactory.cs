using Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.MySql;

namespace Api.Tests;

// Starts a throwaway MySQL container (Docker must be running) and points the API at it.
// A real MySQL is used on purpose: the migrations are specific to the MySQL provider, so SQLite or the
// in-memory provider would not exercise the same schema.
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MySqlContainer _database = new MySqlBuilder("mysql:8.4").Build();

    // The API reads "today" from this clock: a test sets it to check date-dependent rules.
    public TestClock Clock { get; } = new();

    // Explicit implementations: WebApplicationFactory already has its own ValueTask-returning DisposeAsync.
    Task IAsyncLifetime.InitializeAsync() => _database.StartAsync();

    Task IAsyncLifetime.DisposeAsync() => _database.DisposeAsync().AsTask();

    // Runs code directly against the test database (to read rows back, or to provoke a database error).
    public async Task UseDbAsync(Func<AppDbContext, Task> action)
    {
        await using var scope = Services.CreateAsyncScope();
        await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // UseSetting is read by Program.cs before the app is built, unlike ConfigureAppConfiguration.
        builder.UseSetting("ConnectionStrings:Default", _database.GetConnectionString());

        // Registered after Program.cs, so this clock replaces TimeProvider.System.
        builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(Clock));
    }
}

// One container for the whole test run: every test class that joins this collection shares it.
[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "Api";
}

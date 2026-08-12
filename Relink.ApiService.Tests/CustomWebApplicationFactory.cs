using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Relink.ApiService.Data;

namespace Relink.ApiService.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Unique per factory instance: scopes within one factory share a store,
    // while parallel test classes get isolated stores.
    private readonly string _databaseName = $"TestDb-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace Aspire's Npgsql DbContext with InMemory
            // Remove all Aspire DB registrations
            var toRemove = services
                .Where(d => d.ServiceType == typeof(AppDbContext)
                         || d.ServiceType == typeof(DbContextOptions)
                         || d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                         || d.ServiceType.Name.Contains("Npgsql")
                         || d.ServiceType.Name.Contains("PostgreSql")
                         || d.ServiceType.FullName?.Contains("EntityFramework") == true)
                .ToList();

            foreach (var d in toRemove)
                services.Remove(d);

            // Use a fixed database name so the SUT and test scopes share one store.
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            // Remove Worker that tries to run EF migrations
            var worker = services.FirstOrDefault(d => d.ImplementationType == typeof(Worker));
            if (worker != null)
                services.Remove(worker);

            // Disable HTTPS redirection for testing
            services.Configure<Microsoft.AspNetCore.HttpsPolicy.HttpsRedirectionOptions>(options =>
            {
                options.HttpsPort = null;
            });
        });

        builder.ConfigureAppConfiguration((ctx, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["HostOptions:BackgroundServiceExceptionBehavior"] = "Ignore"
            });
        });

        builder.UseSetting("https_port", null);
    }
}

/// <summary>
/// A mock IHttpClientFactory that returns an HttpClient with a configurable handler.
/// </summary>
public class MockHttpClientFactory : IHttpClientFactory
{
    private readonly HttpMessageHandler _handler;

    public MockHttpClientFactory(HttpMessageHandler handler)
    {
        _handler = handler;
    }

    public HttpClient CreateClient(string name)
    {
        return new HttpClient(_handler) { BaseAddress = null };
    }
}

/// <summary>
/// A test double for HttpMessageHandler that returns a predefined response.
/// </summary>
public class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpResponseMessage> _responseFactory;

    public FakeHttpMessageHandler(HttpStatusCode statusCode, string content)
        : this(() => new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(content)
        })
    {
    }

    public FakeHttpMessageHandler(Func<HttpResponseMessage> responseFactory)
    {
        _responseFactory = responseFactory;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return Task.FromResult(_responseFactory());
    }
}

/// <summary>
/// A test double for HttpMessageHandler that counts how many requests it serves.
/// </summary>
public class CountingHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpResponseMessage> _responseFactory;

    public int RequestCount { get; private set; }

    public CountingHttpMessageHandler(Func<HttpResponseMessage> responseFactory)
    {
        _responseFactory = responseFactory;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        RequestCount++;
        return Task.FromResult(_responseFactory());
    }
}

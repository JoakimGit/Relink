using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Relink.ApiService.Tests;

public class ScrapeMetadataTests : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;

    public ScrapeMetadataTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Links.RemoveRange(db.Links);
        db.LinkMetadata.RemoveRange(db.LinkMetadata);
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private HttpClient CreateClient(HttpMessageHandler handler)
    {
        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var mockFactory = new MockHttpClientFactory(handler);

                var httpFactoryDescriptors = services
                    .Where(d => d.ServiceType == typeof(IHttpClientFactory))
                    .ToList();
                foreach (var d in httpFactoryDescriptors)
                    services.Remove(d);

                services.AddSingleton<IHttpClientFactory>(mockFactory);
            });
        }).CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    private static HttpMessageHandler CreateOgHandler(string title, string description, string imageUrl, string siteName)
    {
        var html = $$"""
            <html>
            <head>
            <meta property="og:title" content="{{title}}" />
            <meta property="og:description" content="{{description}}" />
            <meta property="og:image" content="{{imageUrl}}" />
            <meta property="og:site_name" content="{{siteName}}" />
            </head>
            <body></body>
            </html>
            """;

        return new FakeHttpMessageHandler(HttpStatusCode.OK, html);
    }

    private async Task SeedLink(Link link)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Links.Add(link);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task ScrapeMetadata_CreatesMetadata_WhenNoneExists()
    {
        // Arrange
        const string shortCode = "scrape1";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Scrape",
            LongUrl = "https://example.com/article",
        });

        var handler = CreateOgHandler("Test Title", "Test Description", "https://img.example.com/photo.png", "Example Site");
        var client = CreateClient(handler);

        // Act
        var response = await client.PostAsync($"/api/links/{shortCode}/scrape-metadata", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ScrapeMetadataResponse>();
        Assert.NotNull(result);
        Assert.Equal("Test Title", result!.Title);
        Assert.Equal("Test Description", result.Description);
        Assert.Equal("https://img.example.com/photo.png", result.ImageUrl);
        Assert.Equal("Example Site", result.SiteName);
        Assert.True(result.LastScrapedAt > DateTime.MinValue);

        // Verify database state
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var metadata = await db.LinkMetadata.SingleOrDefaultAsync(m => m.ShortenedLinkId == shortCode);
        Assert.NotNull(metadata);
        Assert.Equal("Test Title", metadata!.Title);
        Assert.NotNull(metadata.LastScrapedAt);
    }

    [Fact]
    public async Task ScrapeMetadata_UpdatesExistingMetadata()
    {
        // Arrange
        const string shortCode = "scrape2";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Scrape Update",
            LongUrl = "https://example.com/updated",
        });

        // First scrape
        var handler1 = CreateOgHandler("Old Title", "Old Desc", "https://old.img/1.png", "Old Site");
        var client1 = CreateClient(handler1);
        await client1.PostAsync($"/api/links/{shortCode}/scrape-metadata", null);

        // Second scrape with different data
        var handler2 = CreateOgHandler("New Title", "New Desc", "https://new.img/2.png", "New Site");
        var client2 = CreateClient(handler2);

        // Act
        var response = await client2.PostAsync($"/api/links/{shortCode}/scrape-metadata", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ScrapeMetadataResponse>();
        Assert.NotNull(result);
        Assert.Equal("New Title", result!.Title);

        // Verify only one metadata row exists
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await db.LinkMetadata.CountAsync(m => m.ShortenedLinkId == shortCode);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task ScrapeMetadata_WithNonexistentShortCode_ReturnsNotFound()
    {
        // Arrange
        var handler = CreateOgHandler("Title", "Desc", "https://img.example.com/1.png", "Site");
        var client = CreateClient(handler);

        // Act
        var response = await client.PostAsync("/api/links/nonexistent/scrape-metadata", null);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ScrapeMetadata_WithUnreachableUrl_ReturnsBadGateway()
    {
        // Arrange
        const string shortCode = "scrape3";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Unreachable",
            LongUrl = "https://unreachable.example.com",
        });

        var handler = new FakeHttpMessageHandler(() => throw new HttpRequestException("Connection refused"));
        var client = CreateClient(handler);

        // Act
        var response = await client.PostAsync($"/api/links/{shortCode}/scrape-metadata", null);

        // Assert
        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);

        // Verify no metadata was created
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var metadata = await db.LinkMetadata.SingleOrDefaultAsync(m => m.ShortenedLinkId == shortCode);
        Assert.Null(metadata);
    }

    [Fact]
    public async Task ScrapeMetadata_HandlesMissingOgTags()
    {
        // Arrange
        const string shortCode = "scrape4";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "No OG",
            LongUrl = "https://example.com/no-og",
        });

        var html = "<html><head><title>No OG</title></head><body></body></html>";
        var handler = new FakeHttpMessageHandler(HttpStatusCode.OK, html);
        var client = CreateClient(handler);

        // Act
        var response = await client.PostAsync($"/api/links/{shortCode}/scrape-metadata", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ScrapeMetadataResponse>();
        Assert.NotNull(result);
        Assert.Null(result!.Title);
        Assert.Null(result.Description);
        Assert.Null(result.ImageUrl);
        Assert.Null(result.SiteName);
        Assert.True(result.LastScrapedAt > DateTime.MinValue);
    }

    private record ScrapeMetadataResponse(
        string? Title,
        string? Description,
        string? ImageUrl,
        string? SiteName,
        DateTime LastScrapedAt
    );
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

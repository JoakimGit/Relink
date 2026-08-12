using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Relink.ApiService.Data;
using Relink.ApiService.Data.Entities;

namespace Relink.ApiService.Tests;

public class CrawlerOgServingTests : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;

    public CrawlerOgServingTests(CustomWebApplicationFactory factory)
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

    private async Task SeedLink(Link link)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Links.Add(link);
        await db.SaveChangesAsync();
    }

    private async Task SeedMetadata(LinkMetadata metadata)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.LinkMetadata.Add(metadata);
        await db.SaveChangesAsync();
    }

    private HttpClient CreateClient(HttpMessageHandler? handler = null)
    {
        if (handler is null)
            return _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        return _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var mockFactory = new MockHttpClientFactory(handler);

                var descriptors = services
                    .Where(d => d.ServiceType == typeof(IHttpClientFactory))
                    .ToList();
                foreach (var d in descriptors)
                    services.Remove(d);

                services.AddSingleton<IHttpClientFactory>(mockFactory);
            });
        }).CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
    }

    private static HttpRequestMessage CrawlerRequest(string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.UserAgent.ParseAdd("Twitterbot/1.0");
        return request;
    }

    private static string OpenGraphHtml(string title, string description, string imageUrl, string siteName) => $$"""
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

    private static HttpMessageHandler OpenGraphHandler(string title, string description, string imageUrl, string siteName) =>
        new FakeHttpMessageHandler(HttpStatusCode.OK, OpenGraphHtml(title, description, imageUrl, siteName));

    [Fact]
    public async Task Crawler_ReceivesHtmlPageWithOpenGraphTags()
    {
        const string shortCode = "crawler1";
        await SeedLink(new Link { Id = shortCode, Title = "Example", LongUrl = "https://example.com/article" });

        var client = CreateClient(OpenGraphHandler("Test Title", "Test Description", "https://img.example.com/photo.png", "Example Site"));
        var response = await client.SendAsync(CrawlerRequest($"/{shortCode}"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);

        var html = await response.Content.ReadAsStringAsync();
        Assert.Contains("<meta property=\"og:title\" content=\"Test Title\" />", html);
        Assert.Contains("<meta property=\"og:description\" content=\"Test Description\" />", html);
        Assert.Contains("<meta property=\"og:image\" content=\"https://img.example.com/photo.png\" />", html);
        Assert.Contains("<meta property=\"og:site_name\" content=\"Example Site\" />", html);
        Assert.Contains("<meta property=\"og:url\" content=\"https://example.com/article\" />", html);
    }

    [Fact]
    public async Task Human_StillReceivesRedirect()
    {
        const string shortCode = "crawler2";
        await SeedLink(new Link { Id = shortCode, Title = "Example", LongUrl = "https://example.com/human" });

        var client = CreateClient();
        var response = await client.GetAsync($"/{shortCode}");

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("https://example.com/human", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Crawler_ScrapesLazilyOnFirstRequestAndCaches()
    {
        const string shortCode = "crawler3";
        await SeedLink(new Link { Id = shortCode, Title = "Example", LongUrl = "https://example.com/cached" });

        var calls = 0;
        var handler = new CountingHttpMessageHandler(() =>
        {
            calls++;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(OpenGraphHtml("Cached Title", "Desc", "https://img.example.com/cached.png", "Site")),
            };
        });

        var client = CreateClient(handler);
        var first = await client.SendAsync(CrawlerRequest($"/{shortCode}"));
        var second = await client.SendAsync(CrawlerRequest($"/{shortCode}"));

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Contains("Cached Title", await first.Content.ReadAsStringAsync());
        Assert.Contains("Cached Title", await second.Content.ReadAsStringAsync());
        Assert.Equal(1, calls);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var metadata = await db.LinkMetadata.SingleOrDefaultAsync(m => m.ShortenedLinkId == shortCode);
        Assert.NotNull(metadata);
        Assert.Equal("Cached Title", metadata!.Title);
    }

    [Fact]
    public async Task Crawler_FailedScrape_ServesFallbackPreview()
    {
        const string shortCode = "crawler4";
        await SeedLink(new Link { Id = shortCode, Title = "Fallback Title", LongUrl = "https://example.com/fallback" });

        var handler = new FakeHttpMessageHandler(() => throw new HttpRequestException("Connection refused"));
        var client = CreateClient(handler);
        var response = await client.SendAsync(CrawlerRequest($"/{shortCode}"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = await response.Content.ReadAsStringAsync();
        Assert.Contains("<meta property=\"og:title\" content=\"Fallback Title\" />", html);
        Assert.Contains("<meta property=\"og:url\" content=\"https://example.com/fallback\" />", html);
        Assert.DoesNotContain("og:description", html);
        Assert.DoesNotContain("og:image", html);
    }

    [Fact]
    public async Task Crawler_EmptyScrape_ServesFallbackPreview()
    {
        const string shortCode = "crawler5";
        await SeedLink(new Link { Id = shortCode, Title = "No OG Page", LongUrl = "https://example.com/no-og" });

        var handler = new FakeHttpMessageHandler(HttpStatusCode.OK, "<html><head><title>No OG</title></head><body></body></html>");
        var client = CreateClient(handler);
        var response = await client.SendAsync(CrawlerRequest($"/{shortCode}"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = await response.Content.ReadAsStringAsync();
        Assert.Contains("<meta property=\"og:title\" content=\"No OG Page\" />", html);
        Assert.Contains("<meta property=\"og:url\" content=\"https://example.com/no-og\" />", html);
        Assert.DoesNotContain("og:description", html);
        Assert.DoesNotContain("og:image", html);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var metadata = await db.LinkMetadata.SingleOrDefaultAsync(m => m.ShortenedLinkId == shortCode);
        Assert.Null(metadata);
    }

    [Fact]
    public async Task Crawler_PasswordLockedLink_RedirectsToUnlockPage()
    {
        const string shortCode = "crawler6";
        await SeedLink(new Link { Id = shortCode, Title = "Protected", LongUrl = "https://example.com/protected", PasswordHash = "hashedpassword123" });

        var client = CreateClient(OpenGraphHandler("Should Not Appear", "Desc", "https://img.example.com/x.png", "Site"));
        var response = await client.SendAsync(CrawlerRequest($"/{shortCode}"));

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.EndsWith($"/unlock/{shortCode}", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task UpdateLongUrl_InvalidatesCachedMetadata()
    {
        const string shortCode = "crawler7";
        await SeedLink(new Link { Id = shortCode, Title = "Editable", LongUrl = "https://old.example.com" });
        await SeedMetadata(new LinkMetadata
        {
            ShortenedLinkId = shortCode,
            Title = "Old Title",
            Description = "Old Description",
            ImageUrl = "https://img.example.com/old.png",
            SiteName = "Old Site",
            LastScrapedAt = DateTime.UtcNow,
        });

        var client = CreateClient();
        var patch = await client.PatchAsJsonAsync($"/api/links/{shortCode}", new { title = "Editable", longUrl = "https://new.example.com" });
        Assert.Equal(HttpStatusCode.OK, patch.StatusCode);

        var handler = new CountingHttpMessageHandler(() => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(OpenGraphHtml("New Title", "New Description", "https://img.example.com/new.png", "New Site")),
        });

        var crawlerClient = CreateClient(handler);
        var response = await crawlerClient.SendAsync(CrawlerRequest($"/{shortCode}"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var html = await response.Content.ReadAsStringAsync();
        Assert.Contains("<meta property=\"og:title\" content=\"New Title\" />", html);
        Assert.DoesNotContain("Old Title", html);
        Assert.Contains("<meta property=\"og:url\" content=\"https://new.example.com\" />", html);
    }

    [Fact]
    public async Task ManualScrapeEndpoint_NoLongerExists()
    {
        const string shortCode = "crawler8";
        await SeedLink(new Link { Id = shortCode, Title = "Scrape Gone", LongUrl = "https://example.com" });

        var client = CreateClient();
        var response = await client.PostAsync($"/api/links/{shortCode}/scrape-metadata", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

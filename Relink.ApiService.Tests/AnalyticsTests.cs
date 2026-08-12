using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Relink.ApiService.Analytics;
using Relink.ApiService.Data;
using Relink.ApiService.Data.Entities;

namespace Relink.ApiService.Tests;

public class AnalyticsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AnalyticsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false
    });

    private async Task SeedLink(Link link, params LinkAnalytics[] visits)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Links.Add(link);
        foreach (var visit in visits)
        {
            visit.ShortenedLinkId = link.Id;
            db.LinkAnalytics.Add(visit);
        }
        await db.SaveChangesAsync();
    }

    private static LinkAnalytics Visit(DateTime accessedAt, string? referrer = null, string? userAgent = null) =>
        new() { ShortenedLinkId = string.Empty, AccessedAt = accessedAt, Referrer = referrer, UserAgent = userAgent };

    [Fact]
    public async Task Analytics_ReturnsHourlyBucketsForLast48Hours()
    {
        var now = DateTime.UtcNow;
        await SeedLink(
            new Link { Id = "anahour1", Title = "Hourly", LongUrl = "https://example.com" },
            Visit(now.AddHours(-1)),
            Visit(now.AddHours(-2)));

        var client = CreateClient();
        var response = await client.GetAsync("/api/links/anahour1/analytics");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var analytics = await response.Content.ReadFromJsonAsync<AnalyticsResponse>();
        Assert.NotNull(analytics);

        var hourly = analytics!.VisitCounts.Where(b => b.End - b.Start == TimeSpan.FromHours(1)).ToList();
        Assert.Equal(48, hourly.Count);
        Assert.Equal(2, hourly.Sum(b => b.Count));
    }

    [Fact]
    public async Task Analytics_BucketsVisitsOlderThan48HoursDaily()
    {
        var now = DateTime.UtcNow;
        var fiveDaysAgo = now.AddDays(-5);
        await SeedLink(
            new Link { Id = "anaday1", Title = "Daily", LongUrl = "https://example.com" },
            Visit(fiveDaysAgo));

        var client = CreateClient();
        var analytics = await client.GetFromJsonAsync<AnalyticsResponse>("/api/links/anaday1/analytics");

        Assert.NotNull(analytics);
        var daily = analytics!.VisitCounts.Where(b => b.End - b.Start == TimeSpan.FromDays(1)).ToList();
        var bucket = Assert.Single(daily);
        Assert.Equal(1, bucket.Count);
        Assert.True(bucket.Start <= fiveDaysAgo && fiveDaysAgo < bucket.End);
    }

    [Fact]
    public async Task Analytics_ReturnsTopReferrersWithCounts()
    {
        await SeedLink(
            new Link { Id = "anaref1", Title = "Refs", LongUrl = "https://example.com" },
            Visit(DateTime.UtcNow.AddHours(-1), referrer: "https://twitter.com"),
            Visit(DateTime.UtcNow.AddHours(-2), referrer: "https://twitter.com"),
            Visit(DateTime.UtcNow.AddHours(-3), referrer: "https://google.com"));

        var client = CreateClient();
        var analytics = await client.GetFromJsonAsync<AnalyticsResponse>("/api/links/anaref1/analytics");

        Assert.NotNull(analytics);
        Assert.Collection(analytics!.TopReferrers,
            r => { Assert.Equal("https://twitter.com", r.Referrer); Assert.Equal(2, r.Count); },
            r => { Assert.Equal("https://google.com", r.Referrer); Assert.Equal(1, r.Count); });
    }

    [Fact]
    public async Task Analytics_ReturnsBrowserBreakdown()
    {
        await SeedLink(
            new Link { Id = "anabrows1", Title = "Browsers", LongUrl = "https://example.com" },
            Visit(DateTime.UtcNow.AddHours(-1), userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"),
            Visit(DateTime.UtcNow.AddHours(-2), userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"),
            Visit(DateTime.UtcNow.AddHours(-3), userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0"));

        var client = CreateClient();
        var analytics = await client.GetFromJsonAsync<AnalyticsResponse>("/api/links/anabrows1/analytics");

        Assert.NotNull(analytics);
        Assert.Collection(analytics!.BrowserBreakdown,
            b => { Assert.Equal("Chrome", b.Browser); Assert.Equal(2, b.Count); },
            b => { Assert.Equal("Firefox", b.Browser); Assert.Equal(1, b.Count); });
    }

    [Fact]
    public async Task Analytics_NonexistentLink_ReturnsNotFound()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/api/links/nope/analytics");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ResetVisitCount_ZeroesAndPersistsCount()
    {
        await SeedLink(new Link { Id = "anareset1", Title = "Reset", LongUrl = "https://example.com", VisitCount = 7 });

        var client = CreateClient();
        var response = await client.PostAsync("/api/links/anareset1/reset-visit-count", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.AsNoTracking().SingleAsync(l => l.Id == "anareset1");
        Assert.Equal(0, link.VisitCount);
    }

    [Fact]
    public async Task ResetVisitCount_NonexistentLink_ReturnsNotFound()
    {
        var client = CreateClient();

        var response = await client.PostAsync("/api/links/nope/reset-visit-count", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Relink.ApiService.Tests;

public class GetOriginalUrlTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetOriginalUrlTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false
    });

    private async Task SeedLink(Link link)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Links.Add(link);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task LockedLink_ReturnsGone()
    {
        await SeedLink(new Link { Id = "locked1", LongUrl = "https://example.com", IsLocked = true });
        var client = CreateClient();
        var response = await client.GetAsync("/api/locked1");
        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }

    [Fact]
    public async Task PreStartDate_ReturnsForbidden()
    {
        await SeedLink(new Link { Id = "future1", LongUrl = "https://example.com", StartDate = DateTime.UtcNow.AddDays(7) });
        var client = CreateClient();
        var response = await client.GetAsync("/api/future1");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("not yet available", problem!.Detail);
    }

    [Fact]
    public async Task ExpiredLink_ReturnsGone()
    {
        await SeedLink(new Link { Id = "expired1", LongUrl = "https://example.com", ExpirationDate = DateTime.UtcNow.AddDays(-1) });
        var client = CreateClient();
        var response = await client.GetAsync("/api/expired1");
        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("expired", problem!.Detail);
    }

    [Fact]
    public async Task MaxVisitsReached_ReturnsForbidden()
    {
        await SeedLink(new Link { Id = "maxed1", LongUrl = "https://example.com", MaxVisits = 5, VisitCount = 5 });
        var client = CreateClient();
        var response = await client.GetAsync("/api/maxed1");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("limit", problem!.Detail);
    }

    [Fact]
    public async Task PasswordLockedLink_RedirectsToUnlockPage()
    {
        await SeedLink(new Link { Id = "pwlock1", LongUrl = "https://example.com", PasswordHash = "hashedpassword123" });
        var client = CreateClient();
        var response = await client.GetAsync("/api/pwlock1");
        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("/unlock/pwlock1", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task UnconstrainedLink_RedirectsToLongUrl()
    {
        await SeedLink(new Link { Id = "normal1", LongUrl = "https://example.com/page" });
        var client = CreateClient();
        var response = await client.GetAsync("/api/normal1");
        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal("https://example.com/page", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task UnconstrainedLink_IncrementsVisitCount()
    {
        await SeedLink(new Link { Id = "visit1", LongUrl = "https://example.com", VisitCount = 3 });
        var client = CreateClient();
        await client.GetAsync("/api/visit1");
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updated = await db.Links.AsNoTracking().FirstAsync(l => l.Id == "visit1");
        Assert.Equal(4, updated.VisitCount);
    }

    [Fact]
    public async Task UnconstrainedLink_RecordsAnalytics()
    {
        await SeedLink(new Link { Id = "analytics1", LongUrl = "https://example.com" });
        var client = CreateClient();
        await client.GetAsync("/api/analytics1");
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var analytics = await db.LinkAnalytics.Where(a => a.ShortenedLinkId == "analytics1").ToListAsync();
        Assert.Single(analytics);
    }

    [Fact]
    public async Task NotFound_ReturnsNotFound()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/nonexistent");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ConstraintPriority_LockOverridesStartDate()
    {
        await SeedLink(new Link { Id = "priority1", LongUrl = "https://example.com", IsLocked = true, StartDate = DateTime.UtcNow.AddDays(7) });
        var client = CreateClient();
        var response = await client.GetAsync("/api/priority1");
        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }
}

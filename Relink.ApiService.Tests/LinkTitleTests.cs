using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Relink.ApiService.Data;
using Relink.ApiService.Data.Entities;

namespace Relink.ApiService.Tests;

public class LinkTitleTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public LinkTitleTests(CustomWebApplicationFactory factory)
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

    private record CreateLinkResponse(string ShortCode, string Title);

    [Fact]
    public async Task CreateLink_WithoutTitle_IsRejected()
    {
        var client = CreateClient();
        var body = new { longUrl = "https://example.com/no-title" };

        var response = await client.PostAsJsonAsync("/api/links", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("Title", problem!.Errors.Keys);
    }

    [Fact]
    public async Task CreateLink_WithTitle_PersistsAndReturnsTitle()
    {
        var client = CreateClient();
        var body = new { longUrl = "https://example.com/with-title", title = "Example Page" };

        var response = await client.PostAsJsonAsync("/api/links", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<CreateLinkResponse>();
        Assert.NotNull(result);
        Assert.Equal("Example Page", result!.Title);
        Assert.False(string.IsNullOrWhiteSpace(result.ShortCode));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.SingleAsync(l => l.Id == result.ShortCode);
        Assert.Equal("Example Page", link.Title);
    }

    [Fact]
    public async Task CreateLink_TitleLongerThan60Characters_IsRejected()
    {
        var client = CreateClient();
        var body = new
        {
            longUrl = "https://example.com/long-title",
            title = new string('a', 61)
        };

        var response = await client.PostAsJsonAsync("/api/links", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("Title", problem!.Errors.Keys);
    }

    [Fact]
    public async Task UpdateLink_ChangesTitle()
    {
        const string shortCode = "titleupdate1";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Old Title",
            LongUrl = "https://example.com/update",
        });

        var client = CreateClient();
        var body = new { title = "New Title" };

        var response = await client.PatchAsJsonAsync($"/api/links/{shortCode}", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.AsNoTracking().SingleAsync(l => l.Id == shortCode);
        Assert.Equal("New Title", link.Title);
    }

    [Fact]
    public async Task UpdateLink_EmptyTitle_IsRejected()
    {
        const string shortCode = "titleupdate2";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Original",
            LongUrl = "https://example.com/update",
        });

        var client = CreateClient();
        var body = new { title = "" };

        var response = await client.PatchAsJsonAsync($"/api/links/{shortCode}", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains("Title", problem!.Errors.Keys);
    }

    [Fact]
    public async Task LinkResponses_DoNotContainFallbackUrl()
    {
        const string shortCode = "fallbackfree1";
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "No Fallback",
            LongUrl = "https://example.com/no-fallback",
        });

        var client = CreateClient();

        var listResponse = await client.GetAsync("/api/links");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listJson = await listResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("fallbackUrl", listJson, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("\"title\":\"No Fallback\"", listJson);
    }

    [Fact]
    public async Task CreateAndUnlockResponses_DoNotContainFallbackUrl()
    {
        var client = CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/links", new
        {
            longUrl = "https://example.com/protected",
            title = "Protected Link",
            password = "secret123",
            preferedShortCode = "fbcheck1"
        });

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("fallbackUrl", createJson, StringComparison.OrdinalIgnoreCase);

        var unlockResponse = await client.PostAsJsonAsync("/api/links/fbcheck1/unlock", new { password = "secret123" });
        Assert.Equal(HttpStatusCode.OK, unlockResponse.StatusCode);
        var unlockJson = await unlockResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("fallbackUrl", unlockJson, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("\"longUrl\":\"https://example.com/protected\"", unlockJson);
    }
}

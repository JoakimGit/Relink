using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Relink.ApiService.Common;

namespace Relink.ApiService.Tests;

public class UnlockLinkTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UnlockLinkTests(CustomWebApplicationFactory factory)
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
    public async Task Unlock_WithCorrectPassword_ReturnsLongUrl()
    {
        // Arrange
        const string shortCode = "unlock1";
        const string password = "secret123";
        var passwordHash = PasswordHasher.CalculatePasswordHash(password, shortCode);
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Protected",
            LongUrl = "https://example.com/protected",
            PasswordHash = passwordHash
        });

        var client = CreateClient();
        var body = new { password };

        // Act
        var response = await client.PostAsJsonAsync($"/api/links/{shortCode}/unlock", body);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(result);
        Assert.Equal("https://example.com/protected", result!["longUrl"]);
    }

    [Fact]
    public async Task Unlock_WithIncorrectPassword_ReturnsForbidden()
    {
        // Arrange
        const string shortCode = "unlock2";
        const string correctPassword = "secret123";
        var passwordHash = PasswordHasher.CalculatePasswordHash(correctPassword, shortCode);
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Protected",
            LongUrl = "https://example.com/protected",
            PasswordHash = passwordHash
        });

        var client = CreateClient();
        var body = new { password = "wrongpassword" };

        // Act
        var response = await client.PostAsJsonAsync($"/api/links/{shortCode}/unlock", body);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Unlock_WithNonexistentShortCode_ReturnsNotFound()
    {
        // Arrange
        var client = CreateClient();
        var body = new { password = "anything" };

        // Act
        var response = await client.PostAsJsonAsync("/api/links/nonexistent/unlock", body);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Unlock_WithEmptyPassword_ReturnsBadRequest()
    {
        // Arrange
        const string shortCode = "unlock3";
        const string password = "secret123";
        var passwordHash = PasswordHasher.CalculatePasswordHash(password, shortCode);
        await SeedLink(new Link
        {
            Id = shortCode,
            Title = "Protected",
            LongUrl = "https://example.com/protected",
            PasswordHash = passwordHash
        });

        var client = CreateClient();
        var body = new { password = "" };

        // Act
        var response = await client.PostAsJsonAsync($"/api/links/{shortCode}/unlock", body);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}

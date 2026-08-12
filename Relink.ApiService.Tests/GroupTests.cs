using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Relink.ApiService.Data;
using Relink.ApiService.Data.Entities;

namespace Relink.ApiService.Tests;

public class GroupTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GroupTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false
    });

    private async Task<Group> SeedGroup(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var group = new Group { Name = name };
        db.Groups.Add(group);
        await db.SaveChangesAsync();
        return group;
    }

    private async Task SeedLink(Link link)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Links.Add(link);
        await db.SaveChangesAsync();
    }

    private record GroupResponse(int Id, string Name);
    private record CreateLinkResponse(string ShortCode, string Title);
    private record LinkResponse(string Id, string Title, int? GroupId, GroupResponse? Group);

    [Fact]
    public async Task CreateGroup_WithUniqueName_CreatesAndReturnsGroup()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/groups", new { name = "Marketing" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<GroupResponse>();
        Assert.NotNull(result);
        Assert.Equal("Marketing", result!.Name);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task CreateGroup_WithDuplicateName_IsRejected()
    {
        await SeedGroup("Duplicate Group");
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/groups", new { name = "Duplicate Group" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task GetAllGroups_ListsAllGroups()
    {
        await SeedGroup("Alpha");
        await SeedGroup("Beta");
        var client = CreateClient();

        var response = await client.GetAsync("/api/groups");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var groups = await response.Content.ReadFromJsonAsync<List<GroupResponse>>();
        Assert.NotNull(groups);
        Assert.Contains(groups!, g => g.Name == "Alpha");
        Assert.Contains(groups!, g => g.Name == "Beta");
    }

    [Fact]
    public async Task UpdateGroup_RenamesGroup()
    {
        var group = await SeedGroup("Old Name");
        var client = CreateClient();

        var response = await client.PutAsJsonAsync($"/api/groups/{group.Id}", new { name = "New Name" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<GroupResponse>();
        Assert.NotNull(result);
        Assert.Equal("New Name", result!.Name);
    }

    [Fact]
    public async Task UpdateGroup_DuplicateName_IsRejected()
    {
        await SeedGroup("Taken");
        var group = await SeedGroup("Other");
        var client = CreateClient();

        var response = await client.PutAsJsonAsync($"/api/groups/{group.Id}", new { name = "Taken" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task DeleteGroup_RemovesGroup()
    {
        var group = await SeedGroup("To Delete");
        var client = CreateClient();

        var response = await client.DeleteAsync($"/api/groups/{group.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var list = await client.GetFromJsonAsync<List<GroupResponse>>("/api/groups");
        Assert.NotNull(list);
        Assert.DoesNotContain(list!, g => g.Id == group.Id);
    }

    [Fact]
    public async Task DeleteGroup_LeavesLinksUncategorized()
    {
        var group = await SeedGroup("Keep Links");
        await SeedLink(new Link
        {
            Id = "groupdelete1",
            Title = "Grouped",
            LongUrl = "https://example.com/grouped",
            GroupId = group.Id
        });
        var client = CreateClient();

        var response = await client.DeleteAsync($"/api/groups/{group.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.AsNoTracking().SingleAsync(l => l.Id == "groupdelete1");
        Assert.NotNull(link);
        Assert.Null(link.GroupId);
    }

    [Fact]
    public async Task CreateLink_WithGroup_AssignsGroup()
    {
        var group = await SeedGroup("Create Assign");
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/links", new
        {
            longUrl = "https://example.com/grouped-create",
            title = "Grouped Create",
            groupId = group.Id
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CreateLinkResponse>();
        Assert.NotNull(created);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.AsNoTracking().SingleAsync(l => l.Id == created!.ShortCode);
        Assert.Equal(group.Id, link.GroupId);
    }

    [Fact]
    public async Task UpdateLink_WithGroup_AssignsGroup()
    {
        const string shortCode = "groupupdate1";
        await SeedLink(new Link { Id = shortCode, Title = "Ungrouped", LongUrl = "https://example.com/update" });
        var group = await SeedGroup("Update Assign");
        var client = CreateClient();

        var response = await client.PatchAsJsonAsync($"/api/links/{shortCode}", new
        {
            title = "Grouped",
            groupId = group.Id
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.AsNoTracking().SingleAsync(l => l.Id == shortCode);
        Assert.Equal(group.Id, link.GroupId);
    }

    [Fact]
    public async Task UpdateLink_WithoutGroupId_KeepsExistingGroup()
    {
        var group = await SeedGroup("Keep On Edit");
        await SeedLink(new Link { Id = "groupkeep1", Title = "Before", LongUrl = "https://example.com/keep", GroupId = group.Id });
        var client = CreateClient();

        var response = await client.PatchAsJsonAsync("/api/links/groupkeep1", new { title = "After" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.Links.AsNoTracking().SingleAsync(l => l.Id == "groupkeep1");
        Assert.Equal("After", link.Title);
        Assert.Equal(group.Id, link.GroupId);
    }

    [Fact]
    public async Task LinkListResponse_IncludesGroup()
    {
        var group = await SeedGroup("List Group");
        await SeedLink(new Link
        {
            Id = "listgroup1",
            Title = "Listed",
            LongUrl = "https://example.com/listed",
            GroupId = group.Id
        });
        var client = CreateClient();

        var response = await client.GetAsync("/api/links");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var links = await response.Content.ReadFromJsonAsync<List<LinkResponse>>();
        var link = Assert.Single(links!, l => l.Id == "listgroup1");
        Assert.NotNull(link.Group);
        Assert.Equal("List Group", link.Group!.Name);
        Assert.Equal(group.Id, link.GroupId);
    }

    [Fact]
    public async Task CreateLink_WithUnknownGroup_IsRejected()
    {
        var client = CreateClient();

        var response = await client.PostAsJsonAsync("/api/links", new
        {
            longUrl = "https://example.com/unknown-group",
            title = "Unknown Group",
            groupId = 999999
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}

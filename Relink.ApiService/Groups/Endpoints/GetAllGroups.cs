namespace Relink.ApiService.Groups.Endpoints;

public class GetAllGroups : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/", Handle)
        .WithSummary("Gets all groups");

    private static async Task<Ok<List<Group>>> Handle(AppDbContext db, CancellationToken ct)
    {
        var groups = await db.Groups.OrderBy(g => g.Name).ToListAsync(ct);
        return TypedResults.Ok(groups);
    }
}

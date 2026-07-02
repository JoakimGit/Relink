namespace Relink.ApiService.Tags.Endpoints;

public class GetAllTags : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/", Handle)
        .WithSummary("Gets all tags");

    private static async Task<Ok<List<Tag>>> Handle(AppDbContext db, CancellationToken ct)
    {
        var tags = await db.Tags.ToListAsync(ct);
        return TypedResults.Ok(tags);
    }
}
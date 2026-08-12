namespace Relink.ApiService.ShortenLink.Endpoints;

public class GetAllLinks : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("", Handle)
        .WithSummary("Gets all shortened URLs");

    private static async Task<Ok<List<Link>>> Handle(AppDbContext db, CancellationToken ct)
    {
        var links = await db.Links.Include(l => l.Tags).Include(l => l.Metadata).Include(l => l.Group).OrderBy(l => l.CreatedAt).ToListAsync(ct);
        return TypedResults.Ok(links);
    }
}
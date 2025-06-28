namespace Relink.ApiService.ShortenLink;

public class GetAllLinks : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/urls", Handle)
        .WithSummary("Gets all shortened URLs");

    private static async Task<Ok<List<ShortenedLink>>> Handle(AppDbContext db, CancellationToken ct)
    {
        var links = await db.ShortenedLinks.ToListAsync(ct);
        return TypedResults.Ok(links);
    }
}
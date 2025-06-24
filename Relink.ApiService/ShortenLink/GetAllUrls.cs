namespace Relink.ApiService.ShortenLink;

public class GetAllUrls : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/urls", Handle).WithSummary("Gets all shortened URLs");
    }

    private static async Task<Ok<List<ShortenedLink>>> Handle(AppDbContext database, CancellationToken cancellationToken)
    {
        var links = await database.ShortenedLinks.ToListAsync(cancellationToken);
        return TypedResults.Ok(links ?? []);
    }
}
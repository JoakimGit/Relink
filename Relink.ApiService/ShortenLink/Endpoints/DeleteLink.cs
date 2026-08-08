namespace Relink.ApiService.ShortenLink.Endpoints;

public class DeleteLink : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapDelete("/{id}", Handle)
        .WithSummary("Deletes a shortened Link");

    private static async Task<Results<NoContent, NotFound>> Handle(
        string id,
        AppDbContext db,
        HybridCache hybridCache,
        CancellationToken ct)
    {
        var link = await db.Links.FindAsync([id], ct);
        if (link == null) return TypedResults.NotFound();

        db.Links.Remove(link);
        await db.SaveChangesAsync(ct);

        await hybridCache.RemoveAsync(link.Id, CancellationToken.None);

        return TypedResults.NoContent();
    }
}

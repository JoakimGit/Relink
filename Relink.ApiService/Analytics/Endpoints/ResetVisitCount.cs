namespace Relink.ApiService.Analytics.Endpoints;

public class ResetVisitCount : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/{id}/reset-visit-count", Handle)
        .WithSummary("Resets a Link's Visit Count to zero");

    private static async Task<Results<NoContent, NotFound>> Handle(
        string id,
        AppDbContext db,
        HybridCache hybridCache,
        CancellationToken ct)
    {
        var link = await db.Links.FindAsync([id], ct);
        if (link == null) return TypedResults.NotFound();

        link.VisitCount = 0;
        await db.SaveChangesAsync(ct);

        await hybridCache.SetAsync(link.Id, link, cancellationToken: CancellationToken.None);
        return TypedResults.NoContent();
    }
}

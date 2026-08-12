namespace Relink.ApiService.Analytics.Endpoints;

public class GetLinkAnalytics : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/{id}/analytics", Handle)
        .WithSummary("Gets aggregated Visit analytics for a Link");

    private static async Task<Results<Ok<AnalyticsResponse>, NotFound>> Handle(
        string id,
        AppDbContext db,
        CancellationToken ct)
    {
        if (!await db.Links.AnyAsync(l => l.Id == id, ct))
            return TypedResults.NotFound();

        var visits = await db.LinkAnalytics
            .AsNoTracking()
            .Where(a => a.ShortenedLinkId == id)
            .ToListAsync(ct);

        return TypedResults.Ok(AnalyticsAggregator.Aggregate(visits, DateTime.UtcNow));
    }
}

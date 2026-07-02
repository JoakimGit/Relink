namespace Relink.ApiService.ShortenLink.Endpoints;

public class UpdateLink : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPatch("/{id}", Handle)
        .WithSummary("Updates a shortened Link");

    public record Request(
        string? Notes,
        string? FallbackUrl,
        DateTime? StartDate,
        DateTime? ExpirationDate,
        string? Password,
        int? MaxVisits,
        string[]? Tags
    );
    public record Response(Link Link);

    private static async Task<Results<Ok<Response>, NotFound>> Handle(
        string id,
        Request request,
        AppDbContext db,
        HybridCache hybridCache,
        CancellationToken ct)
    {
        var link = await db.Links.Include(l => l.Tags).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (link == null) return TypedResults.NotFound();

        link.Notes = request.Notes;
        link.FallbackUrl = request.FallbackUrl;
        link.StartDate = request.StartDate;
        link.ExpirationDate = request.ExpirationDate;

        // Only update password when explicitly provided (non-null, non-empty)
        if (!string.IsNullOrEmpty(request.Password))
        {
            link.PasswordHash = PasswordHasher.CalculatePasswordHash(request.Password, link.Id);
        }

        link.MaxVisits = request.MaxVisits;

        if (request.Tags != null && request.Tags.Length > 0)
        {
            var newTags = await TagUpserter.UpsertAsync(db, request.Tags, ct);
            link.Tags.Clear();
            foreach (var tag in newTags)
            {
                link.Tags.Add(tag);
            }
        }

        await db.SaveChangesAsync(ct);

        var response = new Response(link);

        await hybridCache.SetAsync(link.Id, link, cancellationToken: CancellationToken.None);
        return TypedResults.Ok(response);
    }
}
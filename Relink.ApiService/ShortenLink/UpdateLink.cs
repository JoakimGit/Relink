namespace Relink.ApiService.ShortenLink;

public class UpdateLink : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPatch("/{id}", Handle)
        .WithSummary("Updates a shortened Link");

    public record Request(
        string? Description,
        string? FallbackUrl,
        DateTime? StartDate,
        DateTime? ExpirationDate,
        string? Password,
        int? MaxUsages,
        int[]? TagIds
    );
    public record Response(ShortenedLink Link);

    private static async Task<Results<Ok<Response>, NotFound>> Handle(
        string id,
        Request request,
        AppDbContext db,
        HybridCache hybridCache,
        CancellationToken ct)
    {
        var link = await db.ShortenedLinks.Include(l => l.Tags).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (link == null) return TypedResults.NotFound();

        link.Description = request.Description;
        link.FallbackUrl = request.FallbackUrl;
        link.StartDate = request.StartDate;
        link.ExpirationDate = request.ExpirationDate;
        link.PasswordHash = request.Password != null ? PasswordHasher.CalculatePasswordHash(request.Password, link.Id) : null;
        link.MaxUsages = request.MaxUsages;

        var currentTagIds = link.Tags.Select(t => t.Id).ToList();
        var newTagIds = request.TagIds ?? [];

        var tagsToRemove = link.Tags.Where(t => !newTagIds.Contains(t.Id)).ToList();
        foreach (var tag in tagsToRemove)
        {
            link.Tags.Remove(tag);
        }

        var tagsToAddIds = newTagIds.Except(currentTagIds).ToList();
        var tagsToAdd = await db.Tags.Where(t => tagsToAddIds.Contains(t.Id)).ToListAsync(ct);
        foreach (var tag in tagsToAdd)
        {
            link.Tags.Add(tag);
        }

        await db.SaveChangesAsync(ct);

        var response = new Response(link);

        await hybridCache.SetAsync(link.Id, link, cancellationToken: CancellationToken.None);
        return TypedResults.Ok(response);
    }
}
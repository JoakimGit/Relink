namespace Relink.ApiService.ShortenLink.Endpoints;

public class UpdateLink : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPatch("/{id}", Handle)
        .WithSummary("Updates a shortened Link")
        .WithRequestValidation<Request>();

    public record Request(
        string LongUrl,
        string Title,
        string? Notes,
        DateTime? StartDate,
        DateTime? ExpirationDate,
        string? Password,
        int? MaxVisits,
        string[]? Tags,
        int? GroupId
    );
    public record Response(Link Link);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.LongUrl).NotEmpty();
            RuleFor(x => x.Title).NotEmpty().MaximumLength(60);
            RuleFor(x => x.GroupId).GreaterThan(0);
        }
    }

    private static async Task<Results<Ok<Response>, NotFound, ProblemHttpResult>> Handle(
        string id,
        Request request,
        AppDbContext db,
        HybridCache hybridCache,
        CancellationToken ct)
    {
        var link = await db.Links
            .Include(l => l.Tags)
            .Include(l => l.Group)
            .Include(l => l.Metadata)
            .SingleOrDefaultAsync(x => x.Id == id, ct);
        if (link == null) return TypedResults.NotFound();

        if (request.LongUrl != link.LongUrl)
        {
            link.LongUrl = request.LongUrl;
            if (link.Metadata is not null)
            {
                db.LinkMetadata.Remove(link.Metadata);
                link.Metadata = null;
            }
        }

        link.Title = request.Title;
        link.Notes = request.Notes;
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

        if (request.GroupId.HasValue)
        {
            var group = await db.Groups.SingleOrDefaultAsync(g => g.Id == request.GroupId.Value, ct);
            if (group == null)
                return TypedResults.Problem("Group not found.", statusCode: StatusCodes.Status400BadRequest);

            link.Group = group;
        }

        await db.SaveChangesAsync(ct);

        var response = new Response(link);

        await hybridCache.SetAsync(link.Id, link, cancellationToken: CancellationToken.None);
        return TypedResults.Ok(response);
    }
}
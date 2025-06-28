namespace Relink.ApiService.ShortenLink;

public class AddTagToLink : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/{linkId}/tags/{tagId}", Handle)
        .WithSummary("Associatedates a tag with a shortened link")
        .WithRequestValidation<Request>();

    public record Request(string LinkId, int TagId);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.LinkId).NotEmpty();
            RuleFor(x => x.TagId).NotEmpty();
        }
    }

    private static async Task<Results<Ok, NotFound>> Handle([AsParameters] Request request, AppDbContext db, CancellationToken ct)
    {
        var link = await db.ShortenedLinks.Include(link => link.Tags).SingleOrDefaultAsync(x => x.Id == request.LinkId, ct);
        var tag = await db.Tags.SingleOrDefaultAsync(x => x.Id == request.TagId, ct);

        if (link == null || tag == null)
        {
            return TypedResults.NotFound();
        }

        if (link.Tags.Any(t => t.Id == tag.Id))
        {
            // Tag already associated with the link
            return TypedResults.Ok();
        }

        link.Tags.Add(tag);
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok();
    }
}
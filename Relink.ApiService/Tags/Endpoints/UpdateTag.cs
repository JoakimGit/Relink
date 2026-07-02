namespace Relink.ApiService.Tags.Endpoints;

public class UpdateTag : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPut("/{id}", Handle)
        .WithSummary("Updates a tag")
        .WithRequestValidation<Request>();

    public record Request(string Name);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
        }
    }

    private static async Task<Results<Ok<Tag>, NotFound>> Handle(int id, Request request, AppDbContext db, CancellationToken ct)
    {
        var tag = await db.Tags.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (tag == null) return TypedResults.NotFound();

        tag.Name = request.Name.Trim();
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(tag);
    }
}
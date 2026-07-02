namespace Relink.ApiService.Tags.Endpoints;

public class CreateTag : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/", Handle)
        .WithSummary("Creates a tag")
        .WithRequestValidation<Request>();

    public record Request(string Name);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
        }
    }

    private static async Task<Ok<Tag>> Handle(Request request, AppDbContext db, CancellationToken ct)
    {
        var tag = new Tag { Name = request.Name.Trim() };

        await db.Tags.AddAsync(tag, ct);
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(tag);
    }
}
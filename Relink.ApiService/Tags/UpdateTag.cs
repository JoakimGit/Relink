namespace Relink.ApiService.Tags;

public class UpdateTag : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/", Handle)
        .WithSummary("Updates a tag")
        .WithRequestValidation<Request>();

    public record Request(int Id, string Name);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
        }
    }

    private static async Task<Results<Ok<Tag>, NotFound>> Handle(
        Request request,
        AppDbContext database,
        CancellationToken cancellationToken)
    {
        var tag = await database.Tags.SingleOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (tag == null) return TypedResults.NotFound();

        tag.Name = request.Name.Trim();
        await database.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(tag);
    }
}
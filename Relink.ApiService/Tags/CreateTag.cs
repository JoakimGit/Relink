namespace Relink.ApiService.Tags;

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

    private static async Task<Ok<Tag>> Handle(
        Request request,
        AppDbContext database,
        CancellationToken cancellationToken)
    {
        var tag = new Tag { Name = request.Name.Trim() };

        await database.Tags.AddAsync(tag, cancellationToken);
        await database.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(tag);
    }
}
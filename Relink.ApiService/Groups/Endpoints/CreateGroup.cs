namespace Relink.ApiService.Groups.Endpoints;

public class CreateGroup : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/", Handle)
        .WithSummary("Creates a group")
        .WithRequestValidation<Request>();

    public record Request(string Name);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        }
    }

    private static async Task<Results<Ok<Group>, Conflict>> Handle(
        Request request,
        AppDbContext db,
        CancellationToken ct)
    {
        var name = request.Name.Trim();

        if (await db.Groups.AnyAsync(g => g.Name == name, ct))
            return TypedResults.Conflict();

        var group = new Group { Name = name };
        await db.Groups.AddAsync(group, ct);
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(group);
    }
}

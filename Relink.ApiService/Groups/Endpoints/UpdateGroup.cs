namespace Relink.ApiService.Groups.Endpoints;

public class UpdateGroup : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPut("/{id}", Handle)
        .WithSummary("Renames a group")
        .WithRequestValidation<Request>();

    public record Request(string Name);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        }
    }

    private static async Task<Results<Ok<Group>, NotFound, Conflict>> Handle(
        int id,
        Request request,
        AppDbContext db,
        CancellationToken ct)
    {
        var group = await db.Groups.SingleOrDefaultAsync(g => g.Id == id, ct);
        if (group == null) return TypedResults.NotFound();

        var name = request.Name.Trim();
        if (await db.Groups.AnyAsync(g => g.Name == name && g.Id != id, ct))
            return TypedResults.Conflict();

        group.Name = name;
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(group);
    }
}

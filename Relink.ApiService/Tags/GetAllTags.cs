namespace Relink.ApiService.Tags;

public class GetAllTags : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/", Handle)
        .WithSummary("Gets all tags");

    private static async Task<Ok<List<Tag>>> Handle(
        AppDbContext database,
        CancellationToken cancellationToken)
    {
        var tags = await database.Tags.ToListAsync(cancellationToken);
        return TypedResults.Ok(tags);
    }
}
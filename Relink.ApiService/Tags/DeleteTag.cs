namespace Relink.ApiService.Tags;

public class DeleteTag : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapDelete("/{id}", Handle)
        .WithSummary("Deletes a tag");

    private static async Task<Results<Ok, NotFound>> Handle(int id, AppDbContext db, CancellationToken ct)
    {
        var rowsDeleted = await db.Tags.Where(x => x.Id == id).ExecuteDeleteAsync(ct);
        return rowsDeleted == 1 ? TypedResults.Ok() : TypedResults.NotFound();
    }
}
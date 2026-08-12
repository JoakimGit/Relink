namespace Relink.ApiService.Groups.Endpoints;

public class DeleteGroup : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapDelete("/{id}", Handle)
        .WithSummary("Deletes a group");

    private static async Task<Results<Ok, NotFound>> Handle(
        int id,
        AppDbContext db,
        CancellationToken ct)
    {
        // Load dependents so EF's change tracker nulls their GroupId. The
        // in-memory test provider doesn't enforce the FK's ON DELETE SET NULL;
        // with PostgreSQL the DB handles the null-out on its own.
        var group = await db.Groups.Include(g => g.Links).SingleOrDefaultAsync(g => g.Id == id, ct);
        if (group == null) return TypedResults.NotFound();

        db.Groups.Remove(group);
        await db.SaveChangesAsync(ct);

        return TypedResults.Ok();
    }
}

namespace Relink.ApiService.Tags;

public static class TagUpserter
{
    public static async Task<List<Tag>> UpsertAsync(AppDbContext db, string[] tagNames, CancellationToken ct)
    {
        var existingTags = await db.Tags.Where(t => tagNames.Contains(t.Name)).ToListAsync(ct);
        var existingNames = existingTags.Select(t => t.Name).ToHashSet();

        var newTags = tagNames
            .Where(n => !existingNames.Contains(n))
            .Distinct()
            .Select(n => new Tag { Name = n })
            .ToList();

        if (newTags.Count > 0)
        {
            await db.Tags.AddRangeAsync(newTags, ct);
        }

        return [.. existingTags, .. newTags];
    }
}

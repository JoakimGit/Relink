using System.Text.RegularExpressions;

namespace Relink.ApiService.ShortenLink.Endpoints;

public partial class ScrapeMetadata : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/{id}/scrape-metadata", Handle)
        .WithSummary("Scrapes Open Graph metadata from the Link's Long URL");

    public record Response(
        string? Title,
        string? Description,
        string? ImageUrl,
        string? SiteName,
        DateTime LastScrapedAt
    );

    private static async Task<Results<Ok<Response>, NotFound, ProblemHttpResult>> Handle(
        string id,
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        CancellationToken ct)
    {
        var link = await db.Links
            .Include(l => l.Metadata)
            .SingleOrDefaultAsync(l => l.Id == id, ct);

        if (link is null)
            return TypedResults.NotFound();

        OgData ogData;
        try
        {
            var client = httpClientFactory.CreateClient();
            var html = await client.GetStringAsync(link.LongUrl, ct);
            ogData = ParseOpenGraphTags(html);
        }
        catch (Exception ex)
        {
            return TypedResults.Problem(
                detail: $"Failed to scrape metadata from URL: {ex.Message}",
                statusCode: StatusCodes.Status502BadGateway);
        }

        var now = DateTime.UtcNow;

        if (link.Metadata is null)
        {
            link.Metadata = new LinkMetadata
            {
                ShortenedLinkId = link.Id,
                Title = ogData.Title,
                Description = ogData.Description,
                ImageUrl = ogData.ImageUrl,
                SiteName = ogData.SiteName,
                LastScrapedAt = now,
            };
        }
        else
        {
            link.Metadata.Title = ogData.Title;
            link.Metadata.Description = ogData.Description;
            link.Metadata.ImageUrl = ogData.ImageUrl;
            link.Metadata.SiteName = ogData.SiteName;
            link.Metadata.LastScrapedAt = now;
        }

        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(new Response(
            ogData.Title,
            ogData.Description,
            ogData.ImageUrl,
            ogData.SiteName,
            now));
    }

    private static OgData ParseOpenGraphTags(string html)
    {
        return new OgData
        {
            Title = ExtractMetaContent(html, "og:title"),
            Description = ExtractMetaContent(html, "og:description"),
            ImageUrl = ExtractMetaContent(html, "og:image"),
            SiteName = ExtractMetaContent(html, "og:site_name"),
        };
    }

    private static string? ExtractMetaContent(string html, string property)
    {
        // Match <meta property="og:title" content="..." /> or <meta name="og:title" content="..." />
        var pattern = $@"<meta\s+[^>]*?(?:property|name)\s*=\s*[""']{Regex.Escape(property)}[""'][^>]*?content\s*=\s*[""']([^""']*)[""'][^>]*?/?>";
        var match = Regex.Match(html, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);

        if (match.Success)
            return match.Groups[1].Value;

        // Try reversed attribute order: content before property/name
        var reversedPattern = $@"<meta\s+[^>]*?content\s*=\s*[""']([^""']*)[""'][^>]*?(?:property|name)\s*=\s*[""']{Regex.Escape(property)}[""'][^>]*?/?>";
        var reversedMatch = Regex.Match(html, reversedPattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);

        return reversedMatch.Success ? reversedMatch.Groups[1].Value : null;
    }

    private record struct OgData
    {
        public string? Title { get; init; }
        public string? Description { get; init; }
        public string? ImageUrl { get; init; }
        public string? SiteName { get; init; }
    }
}

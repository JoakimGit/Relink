using System.Text.RegularExpressions;

namespace Relink.ApiService.Common;

public static class LinkMetadataScraper
{
    public record ScrapedMetadata
    {
        public string? Title { get; init; }
        public string? Description { get; init; }
        public string? ImageUrl { get; init; }
        public string? SiteName { get; init; }

        public bool HasContent =>
            !string.IsNullOrWhiteSpace(Title) ||
            !string.IsNullOrWhiteSpace(Description) ||
            !string.IsNullOrWhiteSpace(ImageUrl) ||
            !string.IsNullOrWhiteSpace(SiteName);
    }

    public static async Task<ScrapedMetadata> ScrapeAsync(
        IHttpClientFactory httpClientFactory,
        string longUrl,
        CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        var html = await client.GetStringAsync(longUrl, ct);
        return Parse(html);
    }

    public static ScrapedMetadata Parse(string html) => new()
    {
        Title = ExtractMetaContent(html, "og:title"),
        Description = ExtractMetaContent(html, "og:description"),
        ImageUrl = ExtractMetaContent(html, "og:image"),
        SiteName = ExtractMetaContent(html, "og:site_name"),
    };

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
}

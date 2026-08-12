using System.Net;
using System.Text;

namespace Relink.ApiService.ShortenLink;

public static class LinkPreview
{
    public static async Task<LinkMetadata?> GetOrCreateMetadataAsync(
        Link link,
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        CancellationToken ct)
    {
        var metadata = await db.LinkMetadata
            .SingleOrDefaultAsync(m => m.ShortenedLinkId == link.Id, ct);

        if (metadata is not null)
            return metadata;

        LinkMetadataScraper.ScrapedMetadata scraped;
        try
        {
            scraped = await LinkMetadataScraper.ScrapeAsync(httpClientFactory, link.LongUrl, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }

        // A scrape with no Open Graph tags is not a rich preview, so don't cache it —
        // a later crawler request retries and might find tags the page added since.
        if (!scraped.HasContent)
            return null;

        metadata = new LinkMetadata
        {
            ShortenedLinkId = link.Id,
            Title = scraped.Title,
            Description = scraped.Description,
            ImageUrl = scraped.ImageUrl,
            SiteName = scraped.SiteName,
            LastScrapedAt = DateTime.UtcNow,
        };

        db.LinkMetadata.Add(metadata);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Another crawler request won the race and created metadata first.
            return await db.LinkMetadata.SingleOrDefaultAsync(m => m.ShortenedLinkId == link.Id, ct);
        }

        return metadata;
    }

    public static string BuildHtml(Link link, LinkMetadata? metadata)
    {
        var url = WebUtility.HtmlEncode(link.LongUrl);
        var title = WebUtility.HtmlEncode(
            string.IsNullOrWhiteSpace(metadata?.Title) ? link.Title : metadata!.Title);

        var builder = new StringBuilder();
        builder.AppendLine("<!DOCTYPE html>");
        builder.AppendLine("<html>");
        builder.AppendLine("<head>");
        builder.AppendLine("<meta charset=\"utf-8\" />");
        builder.AppendLine("<meta property=\"og:type\" content=\"website\" />");
        builder.AppendLine($"<meta property=\"og:url\" content=\"{url}\" />");
        builder.AppendLine($"<meta property=\"og:title\" content=\"{title}\" />");

        if (!string.IsNullOrWhiteSpace(metadata?.Description))
            builder.AppendLine($"<meta property=\"og:description\" content=\"{WebUtility.HtmlEncode(metadata.Description)}\" />");
        if (!string.IsNullOrWhiteSpace(metadata?.ImageUrl))
            builder.AppendLine($"<meta property=\"og:image\" content=\"{WebUtility.HtmlEncode(metadata.ImageUrl)}\" />");
        if (!string.IsNullOrWhiteSpace(metadata?.SiteName))
            builder.AppendLine($"<meta property=\"og:site_name\" content=\"{WebUtility.HtmlEncode(metadata.SiteName)}\" />");

        builder.AppendLine($"<title>{title}</title>");
        builder.AppendLine("</head>");
        builder.AppendLine("<body></body>");
        builder.AppendLine("</html>");

        return builder.ToString();
    }
}

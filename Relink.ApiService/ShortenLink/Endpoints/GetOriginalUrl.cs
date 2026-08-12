using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace Relink.ApiService.ShortenLink.Endpoints;

public class GetOriginalUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/{shortcode:regex(^[a-zA-Z0-9]+$)}", Handle)
        .WithSummary("Redirects to the Long URL, or serves an Open Graph preview page to crawlers");

    public static async Task<Results<NotFound, ProblemHttpResult, RedirectHttpResult, ContentHttpResult>> Handle(
        string shortcode,
        AppDbContext db,
        HybridCache hybridCache,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        [FromServices] IHttpContextAccessor httpContext,
        CancellationToken ct)
    {
        var link = await hybridCache.GetOrCreateAsync(shortcode, async token =>
            await db.Links.SingleOrDefaultAsync(x => x.Id == shortcode, token), cancellationToken: ct);

        if (link is null)
            return TypedResults.NotFound();

        // Constraint checks that apply to everyone: Lock and Password Lock.
        if (link.IsLocked)
            return TypedResults.Problem(
                detail: "This link has been disabled.",
                statusCode: StatusCodes.Status410Gone);

        var clientBaseUrl = configuration.GetValue<string>("ClientBaseUrl") ?? string.Empty;

        if (!string.IsNullOrEmpty(link.PasswordHash))
            return TypedResults.Redirect($"{clientBaseUrl}/unlock/{link.Id}");

        // Crawlers receive an Open Graph preview page. Time-based constraints and
        // Max Visits do not suppress the preview, so only humans check those below.
        var userAgent = httpContext.HttpContext?.Request.Headers.UserAgent.ToString();
        if (CrawlerDetector.IsCrawler(userAgent))
        {
            var metadata = await LinkPreview.GetOrCreateMetadataAsync(link, db, httpClientFactory, ct);
            return TypedResults.Content(LinkPreview.BuildHtml(link, metadata), "text/html", Encoding.UTF8);
        }

        // Remaining constraints for humans: Start Date, Expiration Date, Max Visits.
        var constraintResult = CheckConstraints(link);
        if (constraintResult is not null)
            return constraintResult;

        if (string.IsNullOrEmpty(link.LongUrl))
            return TypedResults.NotFound();

        await RecordVisit(link, db, httpContext, ct);
        return TypedResults.Redirect(link.LongUrl);
    }

    private static ProblemHttpResult? CheckConstraints(Link link)
    {
        // Start Date — not yet available
        if (link.StartDate.HasValue && DateTime.UtcNow < link.StartDate.Value)
            return TypedResults.Problem(
                detail: $"This link is not yet available. It becomes available on {link.StartDate.Value:yyyy-MM-dd}.",
                statusCode: StatusCodes.Status403Forbidden);

        // Expiration Date — expired
        if (link.ExpirationDate.HasValue && DateTime.UtcNow > link.ExpirationDate.Value)
            return TypedResults.Problem(
                detail: $"This link has expired on {link.ExpirationDate.Value:yyyy-MM-dd}.",
                statusCode: StatusCodes.Status410Gone);

        // Max Visits — limit reached
        if (link.MaxVisits.HasValue && link.VisitCount >= link.MaxVisits.Value)
            return TypedResults.Problem(
                detail: $"This link has reached its visit limit of {link.MaxVisits.Value}.",
                statusCode: StatusCodes.Status403Forbidden);

        return null;
    }

    private static async Task RecordVisit(
        Link link,
        AppDbContext db,
        IHttpContextAccessor contextAccessor,
        CancellationToken ct)
    {
        var context = contextAccessor.HttpContext;
        var userAgent = context?.Request.Headers.UserAgent.ToString();
        var referrer = context?.Request.Headers.Referer.ToString();

        var visit = new LinkAnalytics
        {
            ShortenedLinkId = link.Id,
            IpAddress = contextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = userAgent,
            Referrer = referrer
        };

        // Load the entity from the current context to ensure it's tracked.
        // The `link` parameter may be a detached cached copy from HybridCache.
        var trackedLink = await db.Links.FindAsync([link.Id], ct);
        if (trackedLink is not null)
        {
            trackedLink.VisitCount++;
        }

        await db.LinkAnalytics.AddAsync(visit, ct);
        await db.SaveChangesAsync(ct);
    }
}
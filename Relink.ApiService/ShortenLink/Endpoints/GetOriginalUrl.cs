using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Relink.ApiService.ShortenLink.Endpoints;

public class GetOriginalUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/{shortcode:regex(^[a-zA-Z0-9]+$)}", Handle)
        .WithSummary("Gets the longUrl of a link to redirect to");

    public static async Task<Results<NotFound, RedirectHttpResult>> Handle(
        string shortcode,
        AppDbContext db,
        HybridCache hybridCache,
        [FromServices] IHttpContextAccessor httpContext,
        CancellationToken ct)
    {
        var link = await hybridCache.GetOrCreateAsync(shortcode, async token =>
            await db.Links.SingleOrDefaultAsync(x => x.Id == shortcode, token), cancellationToken: ct);

        var redirectUrl = link?.LongUrl ?? link?.FallbackUrl;
        if (link is not null && redirectUrl is not null)
        {
            await RecordVisit(link, db, httpContext, ct);
            return TypedResults.Redirect(redirectUrl);
        }

        return TypedResults.NotFound();
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

        link.VisitCount++;
        await db.LinkAnalytics.AddAsync(visit, ct);
        await db.SaveChangesAsync(ct);
    }
}
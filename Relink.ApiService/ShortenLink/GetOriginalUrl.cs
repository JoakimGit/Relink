using Microsoft.AspNetCore.Mvc;

namespace Relink.ApiService.ShortenLink;

public class GetOriginalUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/{shortcode}", Handle)
        .WithSummary("Gets the longUrl of a link to redirect to")
        .WithRequestValidation<Request>();

    public record Request(string Shortcode);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Shortcode).NotEmpty();
        }
    }

    private static async Task<Results<NotFound, RedirectHttpResult>> Handle(
        string shortcode,
        AppDbContext db,
        HybridCache hybridCache,
        [FromServices] HttpContextAccessor httpContext,
        CancellationToken ct)
    {
        var link = await hybridCache.GetOrCreateAsync(shortcode, async token =>
            await db.ShortenedLinks.SingleOrDefaultAsync(x => x.Id == shortcode, token), cancellationToken: ct);

        var redirectUrl = link?.LongUrl ?? link?.FallbackUrl;
        if (link is not null && redirectUrl is not null)
        {
            await RecordVisit(link, db, httpContext, ct);
            return TypedResults.Redirect(redirectUrl);
        }

        return TypedResults.NotFound();
    }

    private static async Task RecordVisit(
        ShortenedLink link,
        AppDbContext db,
        HttpContextAccessor contextAccessor,
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

        link.CurrentUsages++;
        await db.LinkAnalytics.AddAsync(visit, ct);
        await db.SaveChangesAsync(ct);
    }
}
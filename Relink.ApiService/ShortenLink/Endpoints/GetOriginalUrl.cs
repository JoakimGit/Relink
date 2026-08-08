using Microsoft.AspNetCore.Mvc;

namespace Relink.ApiService.ShortenLink.Endpoints;

public class GetOriginalUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapGet("/{shortcode:regex(^[a-zA-Z0-9]+$)}", Handle)
        .WithSummary("Gets the longUrl of a link to redirect to");

    public static async Task<Results<NotFound, ProblemHttpResult, RedirectHttpResult>> Handle(
        string shortcode,
        AppDbContext db,
        HybridCache hybridCache,
        [FromServices] IHttpContextAccessor httpContext,
        CancellationToken ct)
    {
        var link = await hybridCache.GetOrCreateAsync(shortcode, async token =>
            await db.Links.SingleOrDefaultAsync(x => x.Id == shortcode, token), cancellationToken: ct);

        if (link is null)
            return TypedResults.NotFound();

        // Constraint checks in priority order
        var clientBaseUrl = (httpContext.HttpContext?.RequestServices
            .GetRequiredService<IConfiguration>()
            .GetValue<string>("ClientBaseUrl")) ?? string.Empty;
        var constraintResult = CheckConstraints(link, clientBaseUrl);
        if (constraintResult is not null)
        {
            if (constraintResult is ProblemHttpResult problem)
                return problem;
            if (constraintResult is RedirectHttpResult redirect)
                return redirect;
        }

        // No constraint blocked — record visit and redirect
        var redirectUrl = link.LongUrl ?? link.FallbackUrl;
        if (redirectUrl is not null)
        {
            await RecordVisit(link, db, httpContext, ct);
            return TypedResults.Redirect(redirectUrl);
        }

        return TypedResults.NotFound();
    }

    private static object? CheckConstraints(Link link, string clientBaseUrl)
    {
        // 1. Lock — manual disable
        if (link.IsLocked)
            return TypedResults.Problem(
                detail: "This link has been disabled.",
                statusCode: StatusCodes.Status410Gone);

        // 2. Start Date — not yet available
        if (link.StartDate.HasValue && DateTime.UtcNow < link.StartDate.Value)
            return TypedResults.Problem(
                detail: $"This link is not yet available. It becomes available on {link.StartDate.Value:yyyy-MM-dd}.",
                statusCode: StatusCodes.Status403Forbidden);

        // 3. Expiration Date — expired
        if (link.ExpirationDate.HasValue && DateTime.UtcNow > link.ExpirationDate.Value)
            return TypedResults.Problem(
                detail: $"This link has expired on {link.ExpirationDate.Value:yyyy-MM-dd}.",
                statusCode: StatusCodes.Status410Gone);

        // 4. Max Visits — limit reached
        if (link.MaxVisits.HasValue && link.VisitCount >= link.MaxVisits.Value)
            return TypedResults.Problem(
                detail: $"This link has reached its visit limit of {link.MaxVisits.Value}.",
                statusCode: StatusCodes.Status403Forbidden);

        // 5. Password Lock — redirect to Angular unlock page
        if (!string.IsNullOrEmpty(link.PasswordHash))
            return TypedResults.Redirect($"{clientBaseUrl}/unlock/{link.Id}");

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
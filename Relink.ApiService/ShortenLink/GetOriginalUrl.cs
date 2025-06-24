namespace Relink.ApiService.ShortenLink;

public class GetOriginalUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapGet("/{shortcode}", Handle)
            .WithSummary("Gets the longUrl of a link to redirect to")
            .WithRequestValidation<Request>();
    }

    public record Request(string Shortcode);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Shortcode).NotEmpty().WithMessage("Shortcode is required.");
        }
    }

    private static async Task<IResult> Handle(
        string shortcode,
        AppDbContext database,
        HybridCache hybridCache,
        HttpContextAccessor httpContext,
        CancellationToken cancellationToken)
    {
        var originalUrl = await hybridCache.GetOrCreateAsync(shortcode, async token =>
        {
            var link = await database.ShortenedLinks.Where(x => x.Id == shortcode).SingleOrDefaultAsync(token);
            return link?.LongUrl;
        }, cancellationToken: cancellationToken);

        if (originalUrl is not null)
        {
            await RecordVisit(shortcode, database, httpContext, cancellationToken);
            return TypedResults.Redirect(originalUrl);
        }

        return TypedResults.NotFound();
    }

    private static async Task RecordVisit(
        string shortcode,
        AppDbContext database,
        HttpContextAccessor httpContextAccessor,
        CancellationToken cancellationToken)
    {
        var context = httpContextAccessor.HttpContext;
        var userAgent = context?.Request.Headers.UserAgent.ToString();
        var referrer = context?.Request.Headers.Referer.ToString();

        var visit = new LinkAnalytics
        {
            ShortenedLinkId = shortcode,
            IpAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = userAgent,
            Referrer = referrer
        };

        await database.LinkAnalytics.AddAsync(visit, cancellationToken);
    }
}
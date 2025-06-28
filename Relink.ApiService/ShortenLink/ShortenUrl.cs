namespace Relink.ApiService.ShortenLink;

public class ShortenUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/shorten", Handle)
        .WithSummary("Shortens a URL")
        .WithRequestValidation<Request>();

    public record Request(
        string LongUrl,
        string? PreferedShortCode,
        string? Description,
        string? FallbackUrl,
        DateTime? StartDate,
        DateTime? ExpirationDate,
        string? Password,
        int? MaxUsages,
        int[]? TagIds
    );
    public record Response(string ShortCode);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.LongUrl).NotEmpty();
        }
    }

    private const int MaxRetries = 3;

    private static async Task<Results<Ok<Response>, ProblemHttpResult>> Handle(
        Request request,
        AppDbContext db,
        HybridCache hybridCache,
        ILogger<ShortenUrl> logger,
        CancellationToken ct)
    {
        for (int attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                var shortcode = request.PreferedShortCode?.Trim() ?? ShortLinkIdGenerator.CreateRandomId();
                var link = new ShortenedLink
                {
                    Id = shortcode,
                    LongUrl = request.LongUrl,
                    Description = request.Description,
                    FallbackUrl = request.FallbackUrl,
                    StartDate = request.StartDate,
                    ExpirationDate = request.ExpirationDate,
                    PasswordHash = request.Password != null ? PasswordHasher.CalculatePasswordHash(request.Password, shortcode) : null,
                    MaxUsages = request.MaxUsages,
                    IsLocked = false
                };

                var tags = request.TagIds != null ? await db.Tags.Where(t => request.TagIds.Contains(t.Id)).ToListAsync(ct) : [];

                foreach (var tag in tags)
                {
                    link.Tags.Add(tag);
                }

                await db.ShortenedLinks.AddAsync(link, ct);
                await db.SaveChangesAsync(ct);
                var response = new Response(link.Id);

                await hybridCache.SetAsync(shortcode, link, cancellationToken: CancellationToken.None);
                return TypedResults.Ok(response);
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
            {
                if (!string.IsNullOrEmpty(request.PreferedShortCode?.Trim()))
                {
                    logger.LogWarning(ex, "Unique constraint violation for shortcode '{Shortcode}'", request.PreferedShortCode);
                    return TypedResults.Problem("Failed to shorten URL. Custom shortcode already exists. Please try again with a different shortcode.");
                }
                if (attempt == MaxRetries)
                {
                    logger.LogWarning(ex, "Failed to shorten URL after {MaxRetries} attempts due to unique constraint violation.", MaxRetries);
                    return TypedResults.Problem("Failed to shorten URL. Please try again with a different shortcode.");
                }
            }
        }

        return TypedResults.Problem("Failed to shorten URL.");
    }
}
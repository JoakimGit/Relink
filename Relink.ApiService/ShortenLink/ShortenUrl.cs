namespace Relink.ApiService.ShortenLink;

public class ShortenUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/shorten", Handle)
        .WithSummary("Shortens a URL")
        .WithRequestValidation<Request>();
    }

    public record Request(
        string LongUrl,
        string? PreferedShortCode,
        string? Description,
        string? FallbackUrl,
        DateTime? StartDate,
        DateTime? ExpirationDate,
        string? Password,
        int? MaxUsages
    );
    public record Response(string ShortCode);

    private const int MaxRetries = 3;

    private static async Task<IResult> Handle(
        Request request,
        AppDbContext database,
        HybridCache hybridCache,
        ILogger<ShortenUrl> logger,
        CancellationToken cancellationToken)
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

                await database.ShortenedLinks.AddAsync(link, cancellationToken);
                await database.SaveChangesAsync(cancellationToken);
                var response = new Response(link.Id);

                await hybridCache.SetAsync(shortcode, request.LongUrl, cancellationToken: CancellationToken.None);
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
                    logger.LogError(ex, "Failed to shorten URL after {MaxRetries} attempts due to unique constraint violation.", MaxRetries);
                    return TypedResults.Problem("Failed to shorten URL. Please try again with a different shortcode.");
                }
            }
        }

        return TypedResults.Problem("Failed to shorten URL.");
    }
}
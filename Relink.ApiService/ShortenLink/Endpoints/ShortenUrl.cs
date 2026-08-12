namespace Relink.ApiService.ShortenLink.Endpoints;

public class ShortenUrl : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("", Handle)
        .WithSummary("Shortens a URL")
        .WithRequestValidation<Request>();

    public record Request(
        string LongUrl,
        string Title,
        string? PreferedShortCode,
        string? Notes,
        DateTime? StartDate,
        DateTime? ExpirationDate,
        string? Password,
        int? MaxVisits,
        string[]? Tags,
        int? GroupId
    );
    public record Response(string ShortCode, string Title);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.LongUrl).NotEmpty();
            RuleFor(x => x.Title).NotEmpty().MaximumLength(60);
            RuleFor(x => x.GroupId).GreaterThan(0);
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
                var link = new Link
                {
                    Id = shortcode,
                    Title = request.Title,
                    LongUrl = request.LongUrl,
                    Notes = request.Notes,
                    StartDate = request.StartDate,
                    ExpirationDate = request.ExpirationDate,
                    PasswordHash = request.Password != null ? PasswordHasher.CalculatePasswordHash(request.Password, shortcode) : null,
                    MaxVisits = request.MaxVisits,
                    IsLocked = false
                };

                var tags = request.Tags != null && request.Tags.Length > 0
                    ? await TagUpserter.UpsertAsync(db, request.Tags, ct)
                    : [];

                foreach (var tag in tags)
                {
                    link.Tags.Add(tag);
                }

                if (request.GroupId.HasValue)
                {
                    var group = await db.Groups.SingleOrDefaultAsync(g => g.Id == request.GroupId.Value, ct);
                    if (group == null)
                        return TypedResults.Problem("Group not found.", statusCode: StatusCodes.Status400BadRequest);

                    link.Group = group;
                }

                await db.Links.AddAsync(link, ct);
                await db.SaveChangesAsync(ct);
                var response = new Response(link.Id, link.Title);

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
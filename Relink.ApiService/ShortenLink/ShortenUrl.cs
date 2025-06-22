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

    /* public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.PostId).GreaterThan(0);
            RuleFor(x => x.Content).NotEmpty();
            RuleFor(x => x.ReplyToCommentId).GreaterThan(0);
        }
    } */

    private static async Task<Ok<Response>> Handle(Request request, AppDbContext database, CancellationToken cancellationToken)
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
        return TypedResults.Ok(response);
    }
}
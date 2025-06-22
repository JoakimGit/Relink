namespace Relink.ApiService.ShortenLink;

public class GetLongUrl : IEndpoint
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

    private static async Task<IResult> Handle(string shortcode, AppDbContext database, CancellationToken cancellationToken)
    {
        var link = await database.ShortenedLinks.Where(x => x.Id == shortcode).SingleOrDefaultAsync(cancellationToken);
        return link?.LongUrl is not null ? TypedResults.NotFound() : TypedResults.Redirect(link!.LongUrl);
    }
}
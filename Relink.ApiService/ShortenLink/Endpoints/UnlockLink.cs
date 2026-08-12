using Microsoft.AspNetCore.Mvc;

namespace Relink.ApiService.ShortenLink.Endpoints;

public class UnlockLink : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapPost("/{shortcode:regex(^[a-zA-Z0-9]+$)}/unlock", Handle)
        .WithSummary("Validates a password and returns the long URL on success");

    public static async Task<Results<Ok<UnlockResponse>, NotFound, BadRequest<string>, ProblemHttpResult>> Handle(
        string shortcode,
        [FromBody] UnlockRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Password))
            return TypedResults.BadRequest("Password is required.");

        var link = await db.Links.SingleOrDefaultAsync(x => x.Id == shortcode, ct);

        if (link is null)
            return TypedResults.NotFound();

        if (!PasswordHasher.VerifyPasswordHash(link.PasswordHash, request.Password, shortcode))
            return TypedResults.Problem(
                detail: "Incorrect password.",
                statusCode: StatusCodes.Status403Forbidden);

        return TypedResults.Ok(new UnlockResponse(link.LongUrl));
    }
}

public record UnlockRequest(string Password);
public record UnlockResponse(string LongUrl);

namespace Relink.ApiService.Tags;

public class DeleteTag : IEndpoint
{
    public static void Map(IEndpointRouteBuilder app) => app
        .MapDelete("/", Handle)
        .WithSummary("Deletes a tag")
        .WithRequestValidation<Request>();

    public record Request(int Id);

    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
        }
    }

    private static async Task<Results<Ok, NotFound>> Handle(
        Request request,
        AppDbContext database,
        CancellationToken cancellationToken)
    {
        var rowsDeleted = await database.Tags
            .Where(x => x.Id == request.Id)
            .ExecuteDeleteAsync(cancellationToken);

        return rowsDeleted == 1
            ? TypedResults.Ok()
            : TypedResults.NotFound();
    }
}
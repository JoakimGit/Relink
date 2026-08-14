namespace Relink.ApiService;

public static class Endpoints
{
    public static void MapEndpoints(this WebApplication app)
    {
        var endpoints = app.MapGroup("/api").WithOpenApi();

        // Redirect endpoint at root: /{shortcode}
        app.MapEndpoint<GetOriginalUrl>();

        endpoints.MapLinkEndpoints();
        endpoints.MapGroupEndpoints();
    }

    private static void MapLinkEndpoints(this IEndpointRouteBuilder app)
    {
        var endpoints = app.MapGroup("/links")
            .WithTags("Links");

        endpoints.MapEndpoint<ShortenUrl>();
        endpoints.MapEndpoint<GetAllLinks>();
        endpoints.MapEndpoint<UpdateLink>();
        endpoints.MapEndpoint<DeleteLink>();
        endpoints.MapEndpoint<UnlockLink>();
        endpoints.MapEndpoint<GetLinkAnalytics>();
        endpoints.MapEndpoint<ResetVisitCount>();
    }

    private static void MapGroupEndpoints(this IEndpointRouteBuilder app)
    {
        var endpoints = app.MapGroup("/groups")
            .WithTags("Groups");

        endpoints.MapEndpoint<CreateGroup>();
        endpoints.MapEndpoint<UpdateGroup>();
        endpoints.MapEndpoint<DeleteGroup>();
        endpoints.MapEndpoint<GetAllGroups>();
    }

    private static IEndpointRouteBuilder MapEndpoint<TEndpoint>(this IEndpointRouteBuilder app) where TEndpoint : IEndpoint
    {
        TEndpoint.Map(app);
        return app;
    }
}
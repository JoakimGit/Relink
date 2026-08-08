using Relink.ApiService.ShortenLink.Endpoints;
using Relink.ApiService.Tags.Endpoints;

namespace Relink.ApiService;

public static class Endpoints
{
    public static void MapEndpoints(this WebApplication app)
    {
        var endpoints = app.MapGroup("/api").WithOpenApi();
        endpoints.MapLinkEndpoints();
        endpoints.MapTagEndpoints();
    }

    private static void MapLinkEndpoints(this IEndpointRouteBuilder app)
    {
        var endpoints = app.MapGroup("/links")
            .WithTags("Links");

        // Redirect endpoint at root: /{shortcode}
        // endpoints.MapEndpoint<GetOriginalUrl>();
        app.MapEndpoint<GetOriginalUrl>();

        endpoints.MapEndpoint<ShortenUrl>();
        endpoints.MapEndpoint<GetAllLinks>();
        endpoints.MapEndpoint<UpdateLink>();
        endpoints.MapEndpoint<DeleteLink>();
    }

    private static void MapTagEndpoints(this IEndpointRouteBuilder app)
    {
        var endpoints = app.MapGroup("/tags")
            .WithTags("Tags");

        endpoints.MapEndpoint<CreateTag>();
        endpoints.MapEndpoint<UpdateTag>();
        endpoints.MapEndpoint<DeleteTag>();
        endpoints.MapEndpoint<GetAllTags>();
    }

    private static IEndpointRouteBuilder MapEndpoint<TEndpoint>(this IEndpointRouteBuilder app) where TEndpoint : IEndpoint
    {
        TEndpoint.Map(app);
        return app;
    }
}
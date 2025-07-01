using Relink.ApiService.ShortenLink;
using Relink.ApiService.Tags;

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

        endpoints.MapEndpoint<ShortenUrl>();
        endpoints.MapEndpoint<GetOriginalUrl>();
        endpoints.MapEndpoint<GetAllLinks>();
        endpoints.MapEndpoint<AddTagToLink>();
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
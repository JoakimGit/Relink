using Relink.ApiService.ShortenLink;

namespace Relink.ApiService;

public static class Endpoints
{
    public static void MapEndpoints(this WebApplication app)
    {
        var endpoints = app.MapGroup("").WithOpenApi();

        endpoints.MapEndpoint<ShortenUrl>();
        endpoints.MapEndpoint<GetLongUrl>();
        endpoints.MapEndpoint<GetAllUrls>();
    }

    private static IEndpointRouteBuilder MapEndpoint<TEndpoint>(this IEndpointRouteBuilder app) where TEndpoint : IEndpoint
    {
        TEndpoint.Map(app);
        return app;
    }
}
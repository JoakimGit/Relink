using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Relink.AppHost.Extensions;

internal static class ResourceBuilderExtensions
{
    internal static IResourceBuilder<T> WithSwaggerUI<T>(this IResourceBuilder<T> builder) where T : IResourceWithEndpoints
    {
        return builder.WithCommand(
           "swagger-ui-docs",
            "Swagger API",
            async _ =>
            {
                try
                {
                    var endpoint = builder.GetEndpoint("https");

                    var url = $"{endpoint.Url}/swagger";

                    await Task.Run(() =>
                    {
                        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                    });
                    return new ExecuteCommandResult { Success = true };
                }
                catch (Exception e)
                {
                    return new ExecuteCommandResult { Success = false, ErrorMessage = e.Message };
                }
            },
            new CommandOptions
            {
                UpdateState = context => context.ResourceSnapshot.HealthStatus == HealthStatus.Healthy ? ResourceCommandState.Enabled : ResourceCommandState.Disabled,
                IconName = "Document",
                IconVariant = IconVariant.Filled
            }
        );
    }
}
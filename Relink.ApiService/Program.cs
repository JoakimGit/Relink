global using FluentValidation;
global using Microsoft.AspNetCore.Http.HttpResults;
global using Relink.ApiService.Common;
global using Relink.ApiService.Data;
global using Relink.ApiService.Data.Entities;
global using Relink.ApiService.Common.Extensions;
global using Microsoft.EntityFrameworkCore;
global using Microsoft.Extensions.Caching.Hybrid;
global using Npgsql;
using Microsoft.OpenApi.Models;
using Relink.ApiService;

var builder = WebApplication.CreateBuilder(args);
{
    builder.AddServiceDefaults();

    builder.Services.AddProblemDetails();

    // Temporary fix until .NET 9.0.4 or 10
    builder.Services.AddOpenApi(options =>
    {
        options.AddDocumentTransformer((document, context, cancellationToken) =>
        {
            document.Servers = [new OpenApiServer() { Url = "https://localhost:7445" }]; // matches URL from launchSettings.json
            return Task.CompletedTask;
        });
    });

    builder.Services.AddHostedService<Worker>();
    builder.Services.AddOpenTelemetry().WithTracing(tracing => tracing.AddSource(Worker.ActivitySourceName));

    builder.Services.AddHttpContextAccessor();

    builder.AddNpgsqlDbContext<AppDbContext>(connectionName: "postgresdb");

    builder.AddRedisDistributedCache("redis");

    builder.Services.AddHybridCache();
}


var app = builder.Build();
{
    app.UseExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();

        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", "Relink API V1");
        });
    }

    app.MapDefaultEndpoints();

    app.MapEndpoints();

    app.UseHttpsRedirection();
}

app.Run();

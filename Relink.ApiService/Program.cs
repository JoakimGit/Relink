global using FluentValidation;
global using Microsoft.AspNetCore.Http.HttpResults;
global using Relink.ApiService.Common;
global using Relink.ApiService.Common.Extensions;
global using Relink.ApiService.Data;
global using Relink.ApiService.Data.Entities;
global using Relink.ApiService.ShortenLink.Endpoints;
global using Relink.ApiService.Tags;
global using Relink.ApiService.Tags.Endpoints;
global using Microsoft.EntityFrameworkCore;
global using Microsoft.Extensions.Caching.Hybrid;
global using Npgsql;
using Relink.ApiService;

var builder = WebApplication.CreateBuilder(args);
{
    builder.AddServiceDefaults();

    builder.Services.AddProblemDetails();

    builder.Services.AddOpenApi();

    builder.Services.AddHostedService<Worker>();

    builder.Services.AddOpenTelemetry().WithTracing(tracing => tracing.AddSource(Worker.ActivitySourceName));

    builder.Services.AddHttpContextAccessor();

    builder.AddNpgsqlDbContext<AppDbContext>(connectionName: "postgresdb");

    builder.AddRedisDistributedCache("redis");

    builder.Services.AddHybridCache();

    builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

    builder.Services.AddCors();
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

        app.UseCors(builder => builder.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
    }

    app.MapDefaultEndpoints();

    app.MapEndpoints();

    app.UseHttpsRedirection();
}

app.Run();

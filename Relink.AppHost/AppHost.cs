using Relink.AppHost.Extensions;

var builder = DistributedApplication.CreateBuilder(args);

var redis = builder.AddRedis("redis");

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume("postgres-data")
    .WithPgAdmin(pgAdmin => pgAdmin.WithHostPort(5050));

var postgresdb = postgres.AddDatabase("postgresdb");

var apiService = builder.AddProject<Projects.Relink_ApiService>("apiservice")
    .WithHttpHealthCheck("/health")
    .WithReference(postgresdb).WaitFor(postgresdb)
    .WithReference(redis).WaitFor(redis)
    .WithSwaggerUI();

var client = builder.AddNpmApp("client", "../Relink.Client")
    .WithReference(apiService).WaitFor(apiService)
    .WithHttpEndpoint(env: "PORT", port: 4200);

builder.Build().Run();

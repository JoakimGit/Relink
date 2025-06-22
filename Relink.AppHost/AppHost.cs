using Relink.AppHost.Extensions;

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume("postgres-data")
    .WithPgAdmin(pgAdmin => pgAdmin.WithHostPort(5050));

var postgresdb = postgres.AddDatabase("postgresdb");

var apiService = builder.AddProject<Projects.Relink_ApiService>("apiservice")
    .WithHttpHealthCheck("/health")
    .WithReference(postgresdb).WaitFor(postgresdb)
    .WithSwaggerUI();

/* builder.AddProject<Projects.Relink_Web>("webfrontend")
    .WithExternalHttpEndpoints()
    .WithHttpHealthCheck("/health")
    .WithReference(apiService)
    .WaitFor(apiService); */

builder.Build().Run();

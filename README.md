# ReLink

ReLink is a single-user link shortening and management tool. It lets you create Links with a unique Short Code, redirect them to a Long URL, and manage them from one place.

Links can include optional constraints such as:

- Password Lock
- Start Date and Expiration Date
- Max Visits
- Manual Lock

The project also provides organization and analytics features, including Groups, Link Metadata, and Visit tracking. The frontend is built with Angular, while the backend is an ASP.NET Core API using Entity Framework Core. Aspire orchestrates the application, PostgreSQL, Redis, and the Angular development server.

> This project is primarily a local development and learning project. It is not intended to be a production link-shortening service.

## Run Locally

### Prerequisites

Install the following before starting the project:

- Docker Desktop, running with Linux containers enabled
- The .NET 10 SDK
- Node.js, for the Angular client
- `pnpm`, for installing and running the client dependencies
- Visual Studio with the Aspire tooling, or VS Code with the C# Dev Kit and the relevant .NET tooling

The exact SDK versions used by the repository are defined in the project files and lockfiles. Check those files if your installed versions need to be aligned more precisely.

### Recommended: run with Aspire

1. Start Docker Desktop.
2. Open the repository in Visual Studio or VS Code.
3. Start the `Relink.AppHost` project with F5.
4. Open the client from the Aspire dashboard when the resources are ready.

Aspire starts the API and Angular client and provisions the local PostgreSQL and Redis resources. PostgreSQL uses a persistent Docker volume named `postgres-data`, so local database data can remain between runs.

The client normally runs at `http://localhost:4200/`. The API's local HTTP profile uses `http://localhost:5426`; when running through Aspire, use the endpoint shown in the Aspire dashboard.

## Project Structure

- `Relink.AppHost/` - Aspire orchestration for the local application
- `Relink.ApiService/` - ASP.NET Core API, endpoints, domain logic, and EF Core data access
- `Relink.ApiService.Tests/` - API tests
- `Relink.Client/` - Angular frontend
- `Relink.ServiceDefaults/` - shared Aspire service defaults
- `docs/adr/` - architecture decisions


## Why ReLink Is Not Hosted

A public link-shortening service is easy to abuse. Short URLs can hide phishing pages, malware, scams, spam, and other harmful destinations, while the service operator becomes responsible for handling reports, takedowns, blocklists, abuse prevention, and law-enforcement requests.

Operating a hosted version responsibly would require substantial anti-abuse and link-detection capabilities, such as destination scanning, reputation checks, rate limiting, monitoring, reporting workflows, and ongoing maintenance as abuse patterns change. Designing and operating that system is a significant project in its own right and is outside the purpose of ReLink.

Keeping ReLink local makes the project suitable for experimenting with link management, constraints, analytics, Angular, ASP.NET Core, EF Core, and Aspire without exposing a public redirect service. Any deployment beyond a trusted local environment would need a dedicated security and abuse-prevention review first.

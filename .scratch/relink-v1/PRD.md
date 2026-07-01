Status: ready-for-agent

## Problem Statement

The user has a link shortening app called ReLink with a working backend (ASP.NET Core API with Postgres, orchestrated via Aspire) but no functional frontend. The API code also contains inconsistencies with the resolved domain model — mismatched terminology, missing constraint enforcement on the redirect endpoint, and a tag system that uses IDs instead of names. The user needs the API aligned to the domain glossary and a full Angular client built so the app is usable end-to-end.

## Solution

Bring the API into alignment with the domain glossary defined in `CONTEXT.md`, then build the Angular frontend with a home page for managing Links (create, search, list, edit, delete), password-gated Link unlocking, and Tag management. The app runs locally via Aspire orchestration with the Angular dev server proxied to the API.

## User Stories

1. As a user, I want to see a home page with the brand name "ReLink", a search input, and a create button, so that I can manage my Links from a single dashboard.
2. As a user, I want to see all my Links displayed as cards in a grid, so that I can browse them at a glance.
3. As a user, I want each Link card to show the Short Code, Long URL, Visit Count, Tags, and constraint icons (lock, calendar, etc.), so that I can quickly understand each Link's state.
4. As a user, I want to create a new Link via a modal form with fields for Long URL, Preferred Short Code, Notes, Fallback URL, Start Date, Expiration Date, Password Lock, Max Visits, and Tags, so that I can shorten URLs with optional constraints.
5. As a user, I want the Tags field in the create modal to be a free-text input with autocomplete suggestions from existing Tags, so that I can quickly assign Tags without leaving the form.
6. As a user, I want Tags to be automatically created when I type a new tag name, so that I don't need to manage Tags separately.
7. As a user, I want to edit an existing Link via a modal, so that I can update Notes, constraints, Tags, and other settings.
8. As a user, I want the edit modal to preserve the existing Password Lock if I don't touch the password field, so that updating other fields doesn't accidentally remove the password.
9. As a user, I want to delete a Link, so that I can remove Links I no longer need.
10. As a user, I want to copy a Link's Short Code (or full shortened URL) to my clipboard from the card's action menu, so that I can share it easily.
11. As a user, I want to search through my Links by Short Code, Long URL, or Tag name from the search input on the home page, so that I can find Links quickly.
12. As a user, I want to manually trigger metadata scraping for a Link via a button on the card, so that OG data (title, description, image) is fetched for that Link.
13. As a visitor, I want to visit `/<shortcode>` and be redirected to the Long URL, so that shortened Links work as expected.
14. As a visitor, I want to see a specific message when a Link is locked, expired, not yet started, or has reached its Max Visits, so that I understand why the Link is unavailable.
15. As a visitor, I want to see a password prompt when visiting a password-locked Link, so that I can enter the password and be redirected.
16. As a visitor, I want to be redirected to the Fallback URL if the Long URL is unreachable, so that I still get somewhere useful.
17. As a user, I want the API to enforce constraint priority (Lock → Start Date → Expiration Date → Max Visits → Password Lock), so that the most authoritative constraint is checked first.
18. As a user, I want the API and frontend to use consistent domain terminology (Short Code, Visit, Notes, etc.) throughout, so that the code matches the glossary.

## Implementation Decisions

- **Entity rename**: Rename `ShortenedLink` class to `Link` throughout the codebase, and `ShortenedLinks` DbSet to `Links`.
- **Property renames**: `CurrentUsages` → `VisitCount`, `MaxUsages` → `MaxVisits`, `Description` → `Notes`, `IsLocked` → `IsLocked` (keep, but document as "Lock" in domain terms).
- **Remove `Link.Title`**: Drop the `Title` property from the Link entity — redundant with Short Code, Long URL, and scraped OG title.
- **Tag creation by name**: Change `ShortenUrl` and `UpdateLink` endpoints to accept tag names (strings) instead of tag IDs. Implement upsert logic: if a tag name exists, reuse it; if not, create it. Remove `AddTagToLink` endpoint — made redundant by inline tag creation on create/update.
- **UpdateLink password bug**: Only update `PasswordHash` when a password string is explicitly provided in the request. Null/missing means "don't change."
- **Redirect constraint enforcement**: `GetOriginalUrl` endpoint checks constraints in order: Lock → Start Date → Expiration Date → Max Visits → Password Lock. Non-password failures return specific error responses. Password-locked Links redirect to the Angular app at `/unlock/<shortcode>`.
- **Visit tracking**: Keep `VisitCount` denormalized on the Link entity for now, incremented on each redirect.
- **Angular client structure**: Single-page app with a home page component. Modals for create and edit. A standalone unlock page at `/unlock/:shortcode`. Services for API communication.
- **Styling**: Tailwind CSS for utility styles, Spartan UI (Brain + Helm) for shared UI primitives (dialog, input, button, etc.), ng-icons for iconography.
- **API proxy**: Angular dev server proxies `/api` requests to the API service via `proxy.conf.js`. Aspire orchestrates both services.
- **Routing**: Angular routes: `/` (home), `/unlock/:shortcode` (password prompt). The `/<shortcode>` redirect is handled server-side by the API, not by Angular routing.

## Testing Decisions

- **What makes a good test**: Test external behavior, not implementation details. For the API, send HTTP requests and assert responses and database state. For Angular, render components, interact with them, and assert DOM output and service calls.
- **API tests**: Integration tests against the running API via `WebApplicationFactory` or Aspire-hosted test fixtures. Test each endpoint for success cases and constraint scenarios. Prior art: the codebase has no existing tests, so these will establish the pattern.
- **Angular tests**: Component tests using Angular TestBed. Test the home page renders Links, the create modal submits correct data, the unlock page handles password entry, and search filters correctly. Prior art: standard Angular CLI-generated spec files.

## Out of Scope

- **Groups**: Folder-like organization of Links is deferred. The Group entity exists in the schema but no UI or endpoints beyond the model are included.
- **User authentication**: The app is single-user. No login, registration, or multi-tenancy.
- **Automatic metadata scraping**: Scraping is manually triggered by the user. Background/automatic scraping is out of scope.
- **Analytics dashboard**: Visit data is recorded but there is no analytics visualization UI.
- **Pagination**: The link list endpoint returns all Links without pagination.
- **Deployment**: The app runs locally via Aspire. Cloud deployment is out of scope.

## Further Notes

- The domain glossary is at `CONTEXT.md`. All code and documentation must use the canonical terms defined there.
- ADR 0001 (`docs/adr/0001-client-rendered-password-unlock.md`) documents the decision to render password prompts client-side via Angular rather than server-side from the API.
- The existing Angular scaffold in `Relink.Client/` can be scrapped and rebuilt to match this PRD.

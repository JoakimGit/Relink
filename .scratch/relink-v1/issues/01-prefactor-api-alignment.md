Status: done

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Align the entire API codebase with the domain glossary in `CONTEXT.md`. Rename the `ShortenedLink` entity and its DbSet to `Link`. Rename properties: `CurrentUsages` → `VisitCount`, `MaxUsages` → `MaxVisits`, `Description` → `Notes`. Drop the `Title` property from `Link` entirely.

Change the Tag association model from ID-based to name-based with upsert logic. In `POST /shorten` and `PATCH /{id}`, accept tag names (strings) instead of tag IDs. When a tag name is submitted, look up an existing Tag by name; if it exists, reuse it; if not, create a new Tag. Remove the `POST /{linkId}/tags/{tagId}` endpoint — it is made redundant by inline tag creation.

Fix the `PATCH /{id}` endpoint: only update `PasswordHash` when a non-null, non-empty password string is provided. A missing or empty password means "leave the existing password unchanged."

## Acceptance criteria

- [x] `ShortenedLink` class is renamed to `Link` everywhere (entity, DbContext, endpoints, tests)
- [x] `ShortenedLinks` DbSet is renamed to `Links`
- [x] `CurrentUsages` is renamed to `VisitCount`, `MaxUsages` is renamed to `MaxVisits`
- [x] `Description` is renamed to `Notes`
- [x] `Title` property is removed from `Link`
- [x] `POST /shorten` accepts tag names (strings) instead of tag IDs, with upsert logic
- [x] `PATCH /{id}` accepts tag names (strings) instead of tag IDs, with upsert logic
- [x] `PATCH /{id}` preserves existing password when no password is provided
- [x] `POST /{linkId}/tags/{tagId}` endpoint is removed
- [x] All existing code compiles and passes tests after the rename

## Blocked by

None - can start immediately

## Comments

### 2026-07-02 - Implementation complete

All acceptance criteria implemented:
- Renamed `ShortenedLink` → `Link` entity class, DbSet, and all references across entities, DbContext, endpoints, and migrations
- Renamed properties: `CurrentUsages` → `VisitCount`, `MaxUsages` → `MaxVisits`, `Description` → `Notes`
- Removed `Title` property from `Link` entity
- Changed tag association from ID-based to name-based with upsert logic in `POST /shorten` and `PATCH /{id}`
- Fixed `PATCH /{id}` to only update `PasswordHash` when a non-null, non-empty string is provided
- Removed `AddTagToLink` endpoint (redundant with inline tag creation)
- Registered `UpdateLink` endpoint (was previously defined but not mapped)
- Added EF Core migration `RenameShortenedLinkToLink` with proper RenameTable/RenameColumn operations
- Updated client-side TypeScript types (`link.ts`) and home page (`home.ts`)
- Updated `Microsoft.EntityFrameworkCore.Tools` and `Microsoft.EntityFrameworkCore.Design` to version 10.0.8 for .NET 10 compatibility
- Full solution builds with 0 errors

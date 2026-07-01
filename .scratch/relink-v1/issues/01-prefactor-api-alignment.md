Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Align the entire API codebase with the domain glossary in `CONTEXT.md`. Rename the `ShortenedLink` entity and its DbSet to `Link`. Rename properties: `CurrentUsages` → `VisitCount`, `MaxUsages` → `MaxVisits`, `Description` → `Notes`. Drop the `Title` property from `Link` entirely.

Change the Tag association model from ID-based to name-based with upsert logic. In `POST /shorten` and `PATCH /{id}`, accept tag names (strings) instead of tag IDs. When a tag name is submitted, look up an existing Tag by name; if it exists, reuse it; if not, create a new Tag. Remove the `POST /{linkId}/tags/{tagId}` endpoint — it is made redundant by inline tag creation.

Fix the `PATCH /{id}` endpoint: only update `PasswordHash` when a non-null, non-empty password string is provided. A missing or empty password means "leave the existing password unchanged."

## Acceptance criteria

- [ ] `ShortenedLink` class is renamed to `Link` everywhere (entity, DbContext, endpoints, tests)
- [ ] `ShortenedLinks` DbSet is renamed to `Links`
- [ ] `CurrentUsages` is renamed to `VisitCount`, `MaxUsages` is renamed to `MaxVisits`
- [ ] `Description` is renamed to `Notes`
- [ ] `Title` property is removed from `Link`
- [ ] `POST /shorten` accepts tag names (strings) instead of tag IDs, with upsert logic
- [ ] `PATCH /{id}` accepts tag names (strings) instead of tag IDs, with upsert logic
- [ ] `PATCH /{id}` preserves existing password when no password is provided
- [ ] `POST /{linkId}/tags/{tagId}` endpoint is removed
- [ ] All existing code compiles and passes tests after the rename

## Blocked by

None - can start immediately

# 01 — Link schema + API: Title and FallbackUrl

**What to build:** Every Link has a required human-readable Title and the FallbackUrl concept is gone. Creating or editing a Link requires a Title, the API returns it, and existing Links are migrated to carry their Short Code as a placeholder Title. The redirect only ever uses the Long URL.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Creating a Link without a Title is rejected with a validation error
- [x] Creating a Link with a Title persists it and returns the Title
- [x] Editing a Link can change its Title; setting it empty is rejected
- [x] Titles longer than 60 characters are rejected
- [x] Existing Links are backfilled with their Short Code as their Title
- [x] FallbackUrl no longer appears in any API response, and the redirect endpoint ignores it

## Comments

- Implemented 2026-08-12. Schema, API endpoints, and EF migration `20260812155114_AddTitleRemoveFallbackUrl` (drops `FallbackUrl`, adds required `Title`, backfills `Title` from the Short Code). HTTP integration tests in `Relink.ApiService.Tests/LinkTitleTests.cs`. Full backend suite: 26/26 passing.
- Also fixed two pre-existing test-infra issues discovered while running the suite: `GetOriginalUrlTests` hit `/api/{shortcode}` instead of the root `/{shortcode}` redirect route, and `CustomWebApplicationFactory` now uses a unique InMemory DB name per factory so parallel test classes don't share (and race on) one store.

# 01 — Link schema + API: Title and FallbackUrl

**What to build:** Every Link has a required human-readable Title and the FallbackUrl concept is gone. Creating or editing a Link requires a Title, the API returns it, and existing Links are migrated to carry their Short Code as a placeholder Title. The redirect only ever uses the Long URL.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Creating a Link without a Title is rejected with a validation error
- [ ] Creating a Link with a Title persists it and returns the Title
- [ ] Editing a Link can change its Title; setting it empty is rejected
- [ ] Titles longer than 60 characters are rejected
- [ ] Existing Links are backfilled with their Short Code as their Title
- [ ] FallbackUrl no longer appears in any API response, and the redirect endpoint ignores it

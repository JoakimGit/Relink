# 01 — Remove Tags

**What to build:** Remove Tags as a domain concept in one pass. After this ticket, creating, listing, and updating Links involves no Tags, the Tag API routes are gone, no Tag tables remain in the schema, the Link form has no Tags field, cards show no Tag chips, and search no longer matches Tags. Links and Groups continue to work unchanged, and existing Group assignments survive.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] The Tag API routes are removed; requesting them returns not-found
- [x] Link create and update succeed without any Tags input and no longer return Tags
- [x] The Link list response contains no Tags
- [x] A database migration drops the Tag tables (the Tag entity and the Link↔Tag join)
- [x] The Link form has no Tags field
- [x] Link cards show no Tag chips
- [x] Search no longer matches Tag names and the placeholder no longer mentions Tags
- [x] The glossary drops the Tag term and the intro no longer references Tags
- [x] Existing Groups and Group assignments are unaffected

## Comments

- Implemented 2026-08-14. Deleted the Tag entity, `TagUpserter`, and the four Tag CRUD endpoints; removed the `Tags` navigation from `Link`, the `DbSet<Tag>`, and the `MapTagEndpoints` route group, so `/api/tags` now 404s. `ShortenUrl`/`UpdateLink` request contracts dropped `Tags`, and `GET /api/links` no longer includes Tags. Added migration `20260814192429_RemoveTags` dropping `LinkTag` then `Tags`.
- Frontend: removed the `Tag` type, `tagsResource`, the Tags field from the Link form (and its autocomplete state), the Tag chips from `LinkCard`, and Tag-name matching from `HomePage` search; placeholder now reads "title, code, or URL". Updated `CONTEXT.md` (dropped the Tag term and the intro's Tags mention).
- Tests: added `Relink.ApiService.Tests/RemoveTagsTests.cs` covering the 404s, Tag-free create/update/list responses, and Group-assignment survival. Updated the Angular component/page specs to drop Tag fixtures and assertions. Backend suite: 53/53. Frontend suite: 122/122.

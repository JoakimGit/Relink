# 02 — Group API: CRUD + Link assignment

**What to build:** Groups can be created, listed, renamed, and deleted, and a Link can be assigned to at most one Group when created or edited. Deleting a Group does not delete its Links — they simply become uncategorized.

**Blocked by:** 01 — Link schema + API (Title and FallbackUrl).

**Status:** ready-for-agent

- [x] A Group can be created with a unique name; duplicate names are rejected
- [x] All Groups can be listed
- [x] A Group can be renamed
- [x] A Group can be deleted, leaving its Links intact and uncategorized
- [x] Creating or editing a Link can assign an optional Group
- [x] A Link's Group is returned in the Link list response

## Comments

- Implemented 2026-08-12. Added Group CRUD endpoints (`/api/groups`: create, list, rename, delete) mirroring the Tag endpoints, with duplicate names rejected (409). Link create/update accept an optional `groupId`; `GET /api/links` now includes each Link's `group`. Group deletion loads its Links so EF applies the `SetNull` behavior, leaving them uncategorized. Added `[JsonIgnore]` on `Group.Links` so serialized Link→Group graphs stay acyclic (the HybridCache serializer doesn't apply the HTTP `IgnoreCycles` setting). A Link edit that omits `groupId` leaves the existing Group unchanged. HTTP integration tests in `Relink.ApiService.Tests/GroupTests.cs`. Full backend suite: 38/38 passing.

# 02 — Group API: CRUD + Link assignment

**What to build:** Groups can be created, listed, renamed, and deleted, and a Link can be assigned to at most one Group when created or edited. Deleting a Group does not delete its Links — they simply become uncategorized.

**Blocked by:** 01 — Link schema + API (Title and FallbackUrl).

**Status:** ready-for-agent

- [ ] A Group can be created with a unique name; duplicate names are rejected
- [ ] All Groups can be listed
- [ ] A Group can be renamed
- [ ] A Group can be deleted, leaving its Links intact and uncategorized
- [ ] Creating or editing a Link can assign an optional Group
- [ ] A Link's Group is returned in the Link list response

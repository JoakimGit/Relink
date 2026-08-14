# 01 — Remove Tags

**What to build:** Remove Tags as a domain concept in one pass. After this ticket, creating, listing, and updating Links involves no Tags, the Tag API routes are gone, no Tag tables remain in the schema, the Link form has no Tags field, cards show no Tag chips, and search no longer matches Tags. Links and Groups continue to work unchanged, and existing Group assignments survive.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] The Tag API routes are removed; requesting them returns not-found
- [ ] Link create and update succeed without any Tags input and no longer return Tags
- [ ] The Link list response contains no Tags
- [ ] A database migration drops the Tag tables (the Tag entity and the Link↔Tag join)
- [ ] The Link form has no Tags field
- [ ] Link cards show no Tag chips
- [ ] Search no longer matches Tag names and the placeholder no longer mentions Tags
- [ ] The glossary drops the Tag term and the intro no longer references Tags
- [ ] Existing Groups and Group assignments are unaffected

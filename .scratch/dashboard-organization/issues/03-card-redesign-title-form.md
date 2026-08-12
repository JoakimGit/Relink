# 03 — Card redesign + Title in the link form

**What to build:** The create/edit form requires a Title and no longer exposes FallbackUrl. Link cards lead with the Title and show the domain, a favicon when metadata exists, constraint icons, the Visit Count, and Tags. The Short Code is no longer printed on the card but remains copyable from the actions menu.

**Blocked by:** 01 — Link schema + API (Title and FallbackUrl).

**Status:** ready-for-agent

- [ ] The create/edit modal requires a Title and no longer shows a FallbackUrl field
- [ ] The card's most prominent text is the Title
- [ ] The card shows the domain, constraint icons, Visit Count, and Tags
- [ ] A favicon is shown when Link Metadata exists
- [ ] The Short Code is not displayed on the card
- [ ] Copying the Short Code remains possible from the actions menu
- [ ] The card is extracted into its own reusable component

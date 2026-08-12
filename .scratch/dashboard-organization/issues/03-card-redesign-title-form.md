# 03 — Card redesign + Title in the link form

**What to build:** The create/edit form requires a Title and no longer exposes FallbackUrl. Link cards lead with the Title and show the domain, a favicon when metadata exists, constraint icons, the Visit Count, and Tags. The Short Code is no longer printed on the card but remains copyable from the actions menu.

**Blocked by:** 01 — Link schema + API (Title and FallbackUrl).

**Status:** ready-for-agent

- [x] The create/edit modal requires a Title and no longer shows a FallbackUrl field
- [x] The card's most prominent text is the Title
- [x] The card shows the domain, constraint icons, Visit Count, and Tags
- [x] A favicon is shown when Link Metadata exists
- [x] The Short Code is not displayed on the card
- [x] Copying the Short Code remains possible from the actions menu
- [x] The card is extracted into its own reusable component

## Comments

- Implemented 2026-08-12. Added a required `title` to the frontend `Link`, `CreateLinkRequest`, and `UpdateLinkRequest` types, and a required Title field (maxlength 60, required, validated) to `LinkFormModal`; create/update now send `title`. Extracted the card into a reusable `LinkCard` component (`app-link-card`) that leads with the Title, shows the domain, constraint icons, Visit Count, and Tags, and hides the Short Code. A favicon (derived from the domain via a public favicon service) is rendered only when Link Metadata exists. The actions menu still copies the full Short Code URL; its trigger aria-label now uses the Title instead of the Short Code. Added `shared/utils/url.ts` (`domainOf`, `faviconUrlFor`). Component tests at the card and form seams in `link-card.spec.ts` and `link-form-modal.spec.ts`; `home.spec.ts` updated. Frontend suite: 96/96 passing; `ng build` typechecks clean.

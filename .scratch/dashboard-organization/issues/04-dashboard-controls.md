# 04 — Dashboard controls: Group filter, sort, and search

**What to build:** The dashboard gains a Group pill bar (All Links, each Group with its Link count, and Uncategorized) that filters the grid, a Manage Groups modal for renaming and deleting Groups, inline Group creation when creating or editing a Link, a sort dropdown (newest first default), and search that also matches Titles.

**Blocked by:** 02 — Group API; 03 — Card redesign + Title in the link form.

**Status:** ready-for-agent

- [x] The pill bar lists All Links, every Group with its count, and Uncategorized, including empty Groups
- [x] Selecting a pill filters the grid to that Group
- [x] Groups can be renamed and deleted from the Manage Groups modal
- [x] A new Group can be created inline while creating or editing a Link
- [x] The sort dropdown offers newest first (default), oldest first, most visited, and alphabetical by Title
- [x] Search matches the Link Title

## Comments

- Implemented 2026-08-12. Frontend-only (backend Group CRUD and `groupId` on link create/update already landed in issue 02).
- Added `GroupService` (`groupsResource` + create/rename/delete), a `Group` type on `Link`/requests, and three components: `GroupPillBar`, `SortDropdown`, and `ManageGroupsModal` (rename inline, delete with a confirm dialog that notes Links become uncategorized).
- `HomePage` now composes the pill bar (All Links, every Group with its count, Uncategorized — empty Groups included), the sort dropdown (newest/oldest/most visited/title A–Z), and a Manage Groups button; search now matches Title as well as Short Code, Long URL, and Tags. Deleting/renaming a Group resets the active pill to All Links so the grid never strands on a stale selection.
- `LinkFormModal` gained an inline Group select plus a "+ New" flow that creates a Group and selects it; create/update payloads send `groupId` only when a Group is chosen.
- Component tests at the pre-agreed seams: `sort-dropdown.spec.ts`, `group-pill-bar.spec.ts`, `manage-groups-modal.spec.ts`, plus updates to `home.spec.ts` and `link-form-modal.spec.ts`. Frontend suite: 124/124 passing; `ng build` typechecks clean (bundle-budget warning is pre-existing).
- Out of scope per PRD: un-assigning a single Link from a Group from the edit form (the backend treats an omitted `groupId` as "leave unchanged"; Links become uncategorized via Group deletion instead).

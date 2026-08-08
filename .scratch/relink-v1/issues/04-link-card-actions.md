Status: done

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Add an ellipsis action menu to each Link card. The menu has three actions:

- **Edit**: Opens a pre-filled modal using the same form as the create modal. On submit, calls `PATCH /{id}`. The password field is empty by default; if left empty, the existing Password Lock is preserved. On success, the card updates in the grid.
- **Delete**: Shows a confirmation dialog. On confirm, calls `DELETE /{id}`. On success, the card is removed from the grid.
- **Copy**: Copies the full shortened URL (e.g., `https://relink.local/abc123`) to the clipboard and shows a brief "Copied!" toast or tooltip.

Includes component tests for edit form pre-filling, delete confirmation flow, and clipboard copy behavior.

## Acceptance criteria

- [x] Each card has an ellipsis icon that opens an action menu (dropdown or popover)
- [x] Edit action opens a modal pre-filled with the Link's current data
- [x] Edit modal preserves Password Lock when the password field is left empty
- [x] Delete action shows a confirmation before removing the Link
- [x] Copy action writes the full shortened URL to clipboard
- [x] Copy action shows a brief confirmation (toast or tooltip)
- [x] Component tests verify edit pre-filling, delete confirmation, and copy behavior

## Blocked by

- [01-prefactor-api-alignment](./01-prefactor-api-alignment.md)
- [02-home-page-link-list-search](./02-home-page-link-list-search.md)

## Comments

### 2026-08-08 — Implemented

**Files created:**
- `Relink.Client/src/app/features/links/components/link-card-actions.ts` — ellipsis dropdown with Copy/Edit/Delete
- `Relink.Client/src/app/features/links/components/link-card-actions.spec.ts` — 12 tests
- `Relink.Client/src/app/features/links/components/edit-link-modal.ts` — pre-filled edit modal (PATCH)
- `Relink.Client/src/app/shared/components/confirm-dialog.ts` — reusable confirmation dialog
- `Relink.Client/src/app/shared/services/toast.service.ts` — toast notification service
- `Relink.Client/src/app/shared/components/toast-container.ts` — fixed-position toast renderer

**Files modified:**
- `link.ts` — added `UpdateLinkRequest` type
- `link-service.ts` — added `updateLink()` and `deleteLink()` methods
- `home.ts` — integrated actions menu, edit modal, confirm dialog, toast container
- `home.spec.ts` — added 8 tests for card actions, edit, and delete flows

**Result:** All 63 tests pass, build compiles cleanly.

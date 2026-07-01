Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Add an ellipsis action menu to each Link card. The menu has three actions:

- **Edit**: Opens a pre-filled modal using the same form as the create modal. On submit, calls `PATCH /{id}`. The password field is empty by default; if left empty, the existing Password Lock is preserved. On success, the card updates in the grid.
- **Delete**: Shows a confirmation dialog. On confirm, calls `DELETE /{id}`. On success, the card is removed from the grid.
- **Copy**: Copies the full shortened URL (e.g., `https://relink.local/abc123`) to the clipboard and shows a brief "Copied!" toast or tooltip.

Includes component tests for edit form pre-filling, delete confirmation flow, and clipboard copy behavior.

## Acceptance criteria

- [ ] Each card has an ellipsis icon that opens an action menu (dropdown or popover)
- [ ] Edit action opens a modal pre-filled with the Link's current data
- [ ] Edit modal preserves Password Lock when the password field is left empty
- [ ] Delete action shows a confirmation before removing the Link
- [ ] Copy action writes the full shortened URL to clipboard
- [ ] Copy action shows a brief confirmation (toast or tooltip)
- [ ] Component tests verify edit pre-filling, delete confirmation, and copy behavior

## Blocked by

- [01-prefactor-api-alignment](./01-prefactor-api-alignment.md)
- [02-home-page-link-list-search](./02-home-page-link-list-search.md)

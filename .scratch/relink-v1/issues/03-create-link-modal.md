Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Build the create Link modal, triggered by the "+" button on the home page. The modal is a form dialog with fields for: Long URL (required), Preferred Short Code, Notes, Fallback URL, Start Date, Expiration Date, Password, Max Visits, and Tags. The Tags field is a free-text input with autocomplete suggestions pulled from existing Tags. When the user types a tag name and confirms, it's added as a chip; if the tag name doesn't exist yet, it will be created automatically by the API on submit.

On form submission, the modal calls `POST /shorten` with the form data. On success, the modal closes and the new Link appears in the card grid. On validation error, inline errors are shown.

Includes component tests that verify form submission, tag autocomplete behavior, and validation display.

## Acceptance criteria

- [ ] Create modal opens when clicking the "+" button on the home page
- [ ] Form includes all fields: Long URL (required), Preferred Short Code, Notes, Fallback URL, Start Date, Expiration Date, Password, Max Visits, Tags
- [ ] Tags field supports free-text input with autocomplete dropdown of existing Tags
- [ ] Selected Tags render as removable chips inside the Tags field
- [ ] Form validates that Long URL is not empty
- [ ] On submit, calls `POST /shorten` with correct payload (tag names, not IDs)
- [ ] On success, modal closes and the Link grid refreshes
- [ ] On error, inline validation messages are shown
- [ ] Component tests verify form submission payload and tag autocomplete behavior

## Blocked by

- [01-prefactor-api-alignment](./01-prefactor-api-alignment.md)
- [02-home-page-link-list-search](./02-home-page-link-list-search.md)

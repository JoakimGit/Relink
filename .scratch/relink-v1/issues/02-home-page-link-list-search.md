Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Build the Angular home page that serves as the main dashboard. It has a header row with the "ReLink" brand name, a search input, and a "create new Link" button. Below that, a responsive card grid displays all Links fetched from `GET /urls`.

Each card shows at minimum: the Short Code, the Long URL (truncated), the Visit Count, Tags as chips/badges, and constraint icons (a lock icon if Locked, a calendar icon if Start Date or Expiration Date is set, a password icon if Password Lock is active).

The search input filters the displayed cards client-side by matching against Short Code, Long URL, or Tag names.

Includes an Angular service that communicates with the API, and component tests that verify the page renders Links and search filters correctly.

## Acceptance criteria

- [ ] Home page displays "ReLink" brand header, search input, and create button
- [ ] Link cards render in a responsive grid, populated from `GET /urls`
- [ ] Each card shows Short Code, Long URL, Visit Count, Tags, and constraint icons
- [ ] Search input filters cards by Short Code, Long URL, and Tag names in real-time
- [ ] Empty state is shown when no Links exist
- [ ] API service is injectable and handles HTTP communication
- [ ] Component tests render the page with mock data and assert card content
- [ ] Component tests verify search filtering behavior

## Blocked by

- [01-prefactor-api-alignment](./01-prefactor-api-alignment.md)

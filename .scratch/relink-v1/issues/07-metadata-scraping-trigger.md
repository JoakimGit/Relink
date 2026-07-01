Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Add a "scrape metadata" button to each Link card. When clicked, it calls an API endpoint that fetches Open Graph data (title, description, image URL, site name) from the Link's Long URL and stores it as Link Metadata. The card updates to show the scraped title and image when available. While scraping is in progress, the button shows a loading state.

The API endpoint performs the HTTP fetch to the target URL, parses OG meta tags, and upserts the `LinkMetadata` row with a `LastScrapedAt` timestamp.

Includes integration tests for the API endpoint (mocking the outbound HTTP call to the target URL) and component tests for the button states.

## Acceptance criteria

- [ ] Each card has a "scrape metadata" button (icon or text)
- [ ] Clicking the button calls an API endpoint that fetches OG data from the Long URL
- [ ] Button shows loading state while scraping is in progress
- [ ] On success, card displays the scraped title and image (if available)
- [ ] `LinkMetadata` is upserted with `LastScrapedAt` timestamp
- [ ] API integration test verifies OG parsing and storage
- [ ] Component test verifies button states (idle, loading, success)

## Blocked by

- [01-prefactor-api-alignment](./01-prefactor-api-alignment.md)
- [02-home-page-link-list-search](./02-home-page-link-list-search.md)

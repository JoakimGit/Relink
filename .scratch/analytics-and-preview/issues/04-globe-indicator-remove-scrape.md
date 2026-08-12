# 04 — Globe indicator + remove Scrape Metadata button

**What to build:** The card shows a globe indicator when a rich preview is available (Link Metadata exists), and the manual "Scrape Metadata" action is removed from the menu.

**Blocked by:** analytics-and-preview/03 — Crawler OG serving; dashboard-organization/03 — Card redesign + Title in the link form.

**Status:** ready-for-agent

- [x] The card shows a globe indicator when Link Metadata exists
- [x] The globe indicator is absent when Link Metadata does not exist
- [x] The "Scrape Metadata" item is removed from the card actions menu

## Comments

- Implemented 2026-08-12. `LinkCard` now renders a `lucideGlobe` indicator (`data-testid="globe-indicator"`, tooltip "Rich preview available") next to the Title whenever `link().metadata` exists, and omits it otherwise.
- Removed the manual "Scrape Metadata" action from `LinkCardActions` (button, `isScraping` signal, `onScrape` handler, `metadataScraped` output, and the now-unused `lucideGlobe`/`lucideLoader` icon registrations).
- Dropped the `scrapeMetadata` method from `LinkService`, the `ScrapeMetadataResponse` type, and the `(metadataScraped)` bindings in `LinkCard`/`HomePage` (the backend endpoint was already removed in issue 03).
- Updated component tests: added globe indicator presence/absence coverage and a menu assertion that no scrape action remains; removed the scrape success/failure test groups.
- Frontend suite: 10 files / 131 tests passing; `ng build` typechecks clean (pre-existing NG8113 and bundle-budget warnings only).

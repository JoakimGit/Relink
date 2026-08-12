# 03 — Crawler OG serving + lazy scraping + remove manual scrape endpoint

**What to build:** When a social media crawler requests a Link, the API serves an Open Graph HTML page instead of a redirect, scraping the Long URL lazily on first request. If scraping fails, a preview built from the Link's Title and Long URL is served. Password-locked Links still send crawlers to the unlock page. Editing a Link's Long URL invalidates the cached metadata, and the manual scrape endpoint is removed.

**Blocked by:** dashboard-organization/01 — Link schema + API (Title and FallbackUrl).

**Status:** ready-for-agent

- [x] A request with a crawler User-Agent receives an HTML page containing Open Graph tags
- [x] A request with a non-crawler User-Agent still receives a redirect to the Long URL
- [x] Metadata is scraped lazily on the first crawler request and cached
- [x] A failed or empty scrape yields a preview page built from the Link's Title and Long URL
- [x] A password-locked Link redirects crawlers to the unlock page rather than serving a preview
- [x] Editing a Link's Long URL invalidates its cached metadata
- [x] The manual scrape endpoint no longer exists

## Comments

- Implemented crawler detection (`Common/CrawlerDetector.cs`) and lazy scraping/parsing (`Common/LinkMetadataScraper.cs`), with the preview HTML built in `ShortenLink/LinkPreview.cs`.
- `GetOriginalUrl` now serves an HTML page with Open Graph tags to crawler User-Agents (Twitter, Facebook, LinkedIn, Slack, Discord, Telegram, WhatsApp, and similar). Lock and Password Lock still apply to everyone; time-based constraints and Max Visits are not applied to crawlers. Crawler requests do not record a Visit.
- A scrape that returns no Open Graph tags is not cached (so it is retried later); a failed scrape also serves the Title/Long URL fallback without caching.
- `UpdateLink` now accepts `longUrl`, updates it, and deletes the Link's Metadata when the Long URL changes.
- Removed `POST /api/links/{id}/scrape-metadata` and its tests. Added 8 integration tests in `Relink.ApiService.Tests/CrawlerOgServingTests.cs`. Full backend suite: 48/48 passing.
- Frontend "Scrape Metadata" button removal and the globe indicator are deferred to analytics-and-preview/04 (as its blocked-by note states).

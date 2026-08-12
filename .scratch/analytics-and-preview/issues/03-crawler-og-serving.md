# 03 — Crawler OG serving + lazy scraping + remove manual scrape endpoint

**What to build:** When a social media crawler requests a Link, the API serves an Open Graph HTML page instead of a redirect, scraping the Long URL lazily on first request. If scraping fails, a preview built from the Link's Title and Long URL is served. Password-locked Links still send crawlers to the unlock page. Editing a Link's Long URL invalidates the cached metadata, and the manual scrape endpoint is removed.

**Blocked by:** dashboard-organization/01 — Link schema + API (Title and FallbackUrl).

**Status:** ready-for-agent

- [ ] A request with a crawler User-Agent receives an HTML page containing Open Graph tags
- [ ] A request with a non-crawler User-Agent still receives a redirect to the Long URL
- [ ] Metadata is scraped lazily on the first crawler request and cached
- [ ] A failed or empty scrape yields a preview page built from the Link's Title and Long URL
- [ ] A password-locked Link redirects crawlers to the unlock page rather than serving a preview
- [ ] Editing a Link's Long URL invalidates its cached metadata
- [ ] The manual scrape endpoint no longer exists

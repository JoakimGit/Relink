# Crawler-Served Open Graph Previews

ReLink serves Open Graph metadata as an HTML page to social media crawlers at the redirect endpoint, so shared Links unfurl with a rich preview. This is a deliberate exception to ADR-0001, which rejected serving HTML from the API for the password page.

When a crawler requests `GET /{shortcode}`, the API detects it by User-Agent and returns an HTML page containing Open Graph tags scraped from the Link's target URL. Scraping is automatic and lazy — triggered on the first crawler request and invalidated when the Long URL changes. Humans still receive a 302 redirect. Password-locked Links redirect crawlers to the Angular unlock page like humans, because serving a preview would leak the private destination's title and description.

**Considered alternative:** Keep metadata scraping manual and display it only in the management UI. Rejected because scraped metadata had no user-visible purpose there, and the social-sharing preview is the feature users actually get from it.

**Consequence:** The API now serves HTML for crawlers, contrary to the general rule in ADR-0001. This is intentional and scoped: only crawler User-Agents receive HTML, and only at the redirect endpoint.

# Analytics and Preview

Status: ready-for-agent

## Problem Statement

Every Visit to a Link is recorded (timestamp, IP, referrer, user agent) but never shown to the user. Separately, Link Metadata is scraped only when the user clicks a manual button, yet it serves no visible purpose — shared Links unfurl as bare URLs on social media because the API never serves Open Graph tags.

## Solution

Add an Analytics action to each Link's menu that opens a modal with a visit chart (hourly for the last 48 hours, daily before that), top referrers, and a browser breakdown, plus a reset Visit Count action. Repurpose Link Metadata: scrape it automatically and lazily on the first crawler request, and serve Open Graph tags as an HTML page to social media crawlers so shared Links unfurl with a rich preview.

## User Stories

1. As a user, I want an Analytics action in each Link's actions menu, so that I can inspect visit data for a specific Link.
2. As a user, I want a chart of Visits over time in the analytics modal, so that I can see when my Link was visited.
3. As a user, I want the chart to show hourly buckets for the last 48 hours and daily buckets before that, so that I can see both immediate and long-term trends.
4. As a user, I want a list of top referrers in the analytics modal, so that I know where my traffic comes from.
5. As a user, I want a browser breakdown in the analytics modal, so that I know which browsers and devices visit my Links.
6. As a user, I want a "Reset Visit Count" action inside the analytics modal with a confirmation, so that I can zero the count deliberately and without accidents.
7. As a user, I want shared Links to unfurl with a rich preview (title, description, image) on social media, so that my Links look good when shared.
8. As a user, I want metadata scraping to happen automatically rather than via a manual button, so that I don't have to think about it.
9. As a user, I want the card's globe indicator to show whether a rich preview is available, so that I know the sharing status at a glance.
10. As a user, I want password-locked Links to never reveal a preview, so that private destinations stay private.
11. As a user, I want a fallback preview using my Link's Title and Long URL when scraping fails, so that shared Links still unfurl with something meaningful.
12. As a user, I want the manual "Scrape Metadata" action removed from the UI, so that the actions menu stays clean.

## Implementation Decisions

- Add an analytics endpoint per Link that returns server-side aggregated data: daily visit counts, top referrers with counts, and a browser breakdown with counts.
- Add a reset Visit Count endpoint per Link that zeroes the count; the confirmation is handled client-side.
- Detect crawlers at the redirect endpoint by matching the request's User-Agent against a list of major social crawlers (Twitter, Slack, Discord, Facebook, LinkedIn, Telegram, and similar).
- When a crawler requests a Link, respond with an HTML page containing Open Graph tags rather than a redirect. Use the scraped title as the primary preview title, falling back to the user's Title; include description, image, and site name when available.
- Scrape the Link's Long URL automatically and lazily when a crawler first requests it and no Link Metadata exists. Cache the result. Invalidate the cached metadata when the Long URL is edited.
- If scraping fails or yields nothing, serve a minimal preview page built from the Link's Title and Long URL.
- Password-locked Links redirect crawlers to the unlock page like humans, because a preview would leak the private destination. Time-based constraints (Start Date, Expiration Date, Max Visits) do not suppress the preview for crawlers.
- Remove the manual scrape endpoint and its UI button; the globe icon on the card simply indicates whether a rich preview is available (Link Metadata exists).

## Testing Decisions

- Test only externally observable behavior, never implementation details.
- Backend is tested at the API HTTP integration seam: a crawler User-Agent receives an HTML page with Open Graph tags; a human User-Agent still receives a redirect; a password-locked Link redirects a crawler to the unlock page; lazy scraping uses a mocked HTTP client; a failed scrape falls back to the Title and Long URL; the analytics endpoint returns correct aggregations; the reset endpoint zeroes the count.
- Frontend is tested at the component seam: the analytics modal renders the chart, referrers, and browser breakdown; the reset action triggers its confirmation; the globe indicator reflects whether metadata exists.
- Prior art: the existing redirect and scrape tests exercise the HTTP seam, and the existing link card actions tests exercise the component seam.

## Out of Scope

- Dashboard organization (Groups, Title, sorting, card redesign) — separate spec: dashboard-organization.
- Aggregate analytics across all Links.
- CSV export of analytics data.
- Scheduled re-scraping; metadata is invalidated only when the Long URL is edited.
- Serving previews for password-locked Links.

## Further Notes

- This decision deliberately serves HTML from the API for crawlers, which the earlier password-unlock decision ruled out for the general case; the exception is documented in the architecture decision records.
- Use the project vocabulary: Visit, Visit Count, Link Metadata, Password Lock, Title, Long URL, Lock, Start Date, Expiration Date, Max Visits.

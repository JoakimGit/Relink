# 01 — Analytics API: aggregation + reset Visit Count

**What to build:** A per-Link analytics endpoint returns server-aggregated Visit data — counts by time bucket, top referrers, and a browser breakdown — and a reset endpoint zeroes the Visit Count.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The analytics endpoint returns visit counts bucketed hourly for the last 48 hours and daily before that
- [x] The analytics endpoint returns top referrers with counts
- [x] The analytics endpoint returns a browser breakdown
- [x] The reset endpoint sets Visit Count to zero and persists it

## Comments

- Implemented `GET /api/links/{id}/analytics` and `POST /api/links/{id}/reset-visit-count` (in `Relink.ApiService/Analytics/`).
- Added 7 integration tests in `Relink.ApiService.Tests/AnalyticsTests.cs`; full suite passes (45 tests, 0 failures).

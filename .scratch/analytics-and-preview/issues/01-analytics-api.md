# 01 — Analytics API: aggregation + reset Visit Count

**What to build:** A per-Link analytics endpoint returns server-aggregated Visit data — counts by time bucket, top referrers, and a browser breakdown — and a reset endpoint zeroes the Visit Count.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The analytics endpoint returns visit counts bucketed hourly for the last 48 hours and daily before that
- [ ] The analytics endpoint returns top referrers with counts
- [ ] The analytics endpoint returns a browser breakdown
- [ ] The reset endpoint sets Visit Count to zero and persists it

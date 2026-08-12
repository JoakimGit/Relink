# 02 — Analytics modal in the actions menu

**What to build:** An Analytics action in the card menu opens a modal showing the visit chart (hourly for the last 48 hours, then daily), top referrers, and browser breakdown, with a Reset Visit Count action that asks for confirmation.

**Blocked by:** analytics-and-preview/01 — Analytics API; dashboard-organization/03 — Card redesign + Title in the link form.

**Status:** ready-for-agent

- [x] An Analytics item appears in the card actions menu
- [x] Opening it shows a modal with the visit chart, referrers, and browser breakdown
- [x] The chart shows hourly buckets for the last 48 hours and daily buckets before that
- [x] Reset Visit Count asks for confirmation before resetting and refreshes the card's Visit Count

## Comments

- Added `app-link-analytics-modal` (`Relink.Client/src/app/features/links/components/link-analytics-modal.ts`) plus an Analytics action in `link-card-actions.ts` (chart/referrers/browsers rendered from `GET /api/links/{id}/analytics`; CSS-only bar chart with hourly `HH:00` and daily `dd.MM` bucket labels).
- Reset uses the shared `ConfirmDialog` and calls `POST /api/links/{id}/reset-visit-count`; on success it emits `visitCountReset`, and `HomePage` reloads `linksResource` so the card's Visit Count refreshes.
- Added `AnalyticsResponse`/`VisitBucket`/`ReferrerCount`/`BrowserCount` types and `getAnalytics`/`resetVisitCount` service methods.
- Frontend suite: 10 files / 137 tests passing; `ng build` clean. Backend untouched (consumes issue 01's API).

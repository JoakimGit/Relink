# 05 — Analytics: reset erases history + daily 30-day chart

**What to build:** Two analytics changes in one ticket. Resetting a Visit Count also erases the Link's analytics history, so the card count and the analytics view agree; the glossary's Visit Count term reflects this. The analytics chart becomes daily-only for the last 30 days (zero-count days rendered) and the modal widens so the chart is easier to read. Top referrers and the browser breakdown are unchanged.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Reset Visit Count zeroes the count and removes the Link's analytics history
- [x] After a reset, the analytics endpoint returns empty buckets, referrers, and browsers
- [x] The reset confirmation warns that history will be erased
- [x] The analytics chart shows daily buckets for the last 30 days, zero-count days included
- [x] The chart no longer shows hourly buckets
- [x] The chart caption and accessibility label describe daily buckets
- [x] The analytics modal is wider
- [x] Top referrers and the browser breakdown remain unchanged
- [x] The glossary's Visit Count term reflects reset behavior

## Comments

Implemented.

Backend:
- `AnalyticsAggregator.Aggregate` now returns 30 daily buckets covering the last 30 days ending today (UTC), zero-count days included; hourly buckets removed. Top referrers and browser breakdown still aggregate over all Visits.
- `ResetVisitCount` deletes the Link's `LinkAnalytics` rows alongside zeroing the Visit Count.

Frontend:
- `link-analytics-modal.ts`: widened to `sm:max-w-4xl`, chart caption now "Last 30 days · daily", aria label describes daily buckets, bucket labels are daily only, and the reset confirmation warns the analytics history will be erased.

Glossary:
- `CONTEXT.md` Visit Count term now notes that resetting zeroes the count and erases analytics history.

Tests: `AnalyticsTests.cs` updated (30-day buckets, out-of-window exclusion, reset erases history); `link-analytics-modal.spec.ts` updated. Backend suite 50/50 pass, frontend suite 141/141 pass, typecheck clean.

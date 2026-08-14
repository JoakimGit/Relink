# 05 — Analytics: reset erases history + daily 30-day chart

**What to build:** Two analytics changes in one ticket. Resetting a Visit Count also erases the Link's analytics history, so the card count and the analytics view agree; the glossary's Visit Count term reflects this. The analytics chart becomes daily-only for the last 30 days (zero-count days rendered) and the modal widens so the chart is easier to read. Top referrers and the browser breakdown are unchanged.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Reset Visit Count zeroes the count and removes the Link's analytics history
- [ ] After a reset, the analytics endpoint returns empty buckets, referrers, and browsers
- [ ] The reset confirmation warns that history will be erased
- [ ] The analytics chart shows daily buckets for the last 30 days, zero-count days included
- [ ] The chart no longer shows hourly buckets
- [ ] The chart caption and accessibility label describe daily buckets
- [ ] The analytics modal is wider
- [ ] Top referrers and the browser breakdown remain unchanged
- [ ] The glossary's Visit Count term reflects reset behavior

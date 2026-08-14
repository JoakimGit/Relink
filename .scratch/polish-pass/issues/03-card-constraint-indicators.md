# 03 — Card constraint indicators

**What to build:** Link cards surface the Max Visits constraint and split the Start Date and Expiration Date constraints into distinct indicators. Max Visits shows a gauge icon with current Visits over the cap (for example 3/10), styled destructively when the cap is reached. Start Date and Expiration Date each get their own indicator, rendered only when that date is set.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] A Link with a Max Visits cap shows a gauge indicator with current Visits over the cap
- [ ] The Max Visits indicator is styled destructively when the Visit Count reaches the cap
- [ ] A Link without a Max Visits cap shows no Max Visits indicator
- [ ] Start Date and Expiration Date render as separate indicators, each only when its date is set
- [ ] The Start Date indicator conveys "Starts {date}" and the Expiration Date indicator conveys "Expires {date}"
- [ ] The combined "Date restricted" indicator is gone

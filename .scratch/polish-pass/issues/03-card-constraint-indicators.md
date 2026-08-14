# 03 — Card constraint indicators

**What to build:** Link cards surface the Max Visits constraint and split the Start Date and Expiration Date constraints into distinct indicators. Max Visits shows a gauge icon with current Visits over the cap (for example 3/10), styled destructively when the cap is reached. Start Date and Expiration Date each get their own indicator, rendered only when that date is set.

**Blocked by:** None — can start immediately

**Status:** done

- [x] A Link with a Max Visits cap shows a gauge indicator with current Visits over the cap
- [x] The Max Visits indicator is styled destructively when the Visit Count reaches the cap
- [x] A Link without a Max Visits cap shows no Max Visits indicator
- [x] Start Date and Expiration Date render as separate indicators, each only when its date is set
- [x] The Start Date indicator conveys "Starts {date}" and the Expiration Date indicator conveys "Expires {date}"
- [x] The combined "Date restricted" indicator is gone

## Comments

Implemented in `Relink.Client/src/app/features/links/components/link-card.ts`.

- Added a Max Visits indicator (`lucideGauge`) showing `Visit Count / Max Visits`, styled `text-destructive` when the Visit Count reaches the cap and `text-muted-foreground` otherwise. Rendered only when a cap is set.
- Split the combined calendar icon into two icon-only indicators: Start Date (`lucideCalendarClock`, blue, `Starts {date}`) and Expiration Date (`lucideCalendarX`, destructive, `Expires {date}`). Each renders only when its date is set, and carries both a `title` tooltip and an `aria-label`.

Tests: `Relink.Client/src/app/features/links/components/link-card.spec.ts` and `home.spec.ts` updated (17 card tests) — typecheck and full frontend suite pass.

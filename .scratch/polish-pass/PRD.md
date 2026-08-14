# Polish Pass

Status: ready-for-agent

## Problem Statement

The app is functionally complete, but a finishing pass surfaced several rough edges: the Long URL field errors the moment the user starts typing; Tags and Groups overlap to the point of duplicate work (the user attached a "Manga" Tag and a "Manga" Group to the same Link); Groups can't be created from the Manage Groups modal; the Link card has no Max Visits indicator and bundles Start Date and Expiration Date into one ambiguous icon; resetting a Visit Count leaves the analytics history intact so the card and the analytics view disagree; and the analytics chart mixes hourly and daily buckets in a too-narrow layout.

## Solution

Remove Tags as a domain concept so Groups are the single way to organize Links. Make the Long URL field validate at the right moments (required on submit, format on blur). Add a Max Visits indicator and split the date constraint into two distinct icons on the Link card. Allow Group creation from the Manage Groups modal. Make resetting a Visit Count also erase the Link's analytics history. Simplify the analytics chart to daily buckets for the last 30 days and widen the modal.

## User Stories

1. As a user, I want a single way to organize Links, so that I don't duplicate categorization work.
2. As a user, I want Tags removed from the Link form, so that I'm not asked to categorize a Link twice.
3. As a user, I want Tag chips removed from Link cards, so that cards only show Group-based organization.
4. As a user, I want search to stop matching Tag names, so that results reflect only what still exists.
5. As a user, I want the search placeholder to no longer mention Tags, so that the control describes what it actually does.
6. As a user, I want existing Tags and their Link associations dropped in one migration, so that the schema has no leftover Tag tables.
7. As a user, I want my existing Groups and Group assignments untouched by Tag removal, so that my organization survives.
8. As a user, I want to type a Long URL without an error appearing on the first keystroke, so that I can compose it without false alarms.
9. As a user, I want an empty Long URL to error only when I submit, so that I'm not nagged mid-typing.
10. As a user, I want a malformed Long URL to error only after I leave the field, so that feedback arrives when I'm done typing.
11. As a user, I want to see which Links have a Max Visits cap on their card, so that I know at a glance that a limit exists.
12. As a user, I want the card to show current Visits against the cap (for example 3/10), so that I know how close a Link is to its limit.
13. As a user, I want the Max Visits indicator to look urgent once the cap is reached, so that exhausted Links stand out.
14. As a user, I want separate card indicators for Start Date and Expiration Date, so that I can tell a not-yet-available Link from an expired one.
15. As a user, I want a Start Date indicator only when a Start Date is set, so that unset constraints don't clutter the card.
16. As a user, I want an Expiration Date indicator only when an Expiration Date is set, so that unset constraints don't clutter the card.
17. As a user, I want each date indicator to spell out whether it starts or expires, so that the constraint's meaning is unambiguous.
18. As a user, I want to create a Group from the Manage Groups modal, so that I don't have to open the Link form to do it.
19. As a user, I want a Group I create in Manage Groups to appear immediately in the modal list, so that I can see it was created.
20. As a user, I want a Group I create in Manage Groups to appear in the dashboard pill bar, so that I can filter by it right away.
21. As a user, I want the Manage Groups empty state to reflect that Groups can be created there, so that the affordance is discoverable.
22. As a user, I want resetting a Visit Count to also erase that Link's analytics history, so that the card and the analytics view always agree.
23. As a user, I want the reset confirmation to warn that history is erased, so that I don't lose data by accident.
24. As a user, I want the analytics chart to show daily buckets for the last 30 days, so that I see long-term trends without hourly noise.
25. As a user, I want zero-count days rendered in the chart, so that gaps in activity are visible.
26. As a user, I want a wider analytics chart, so that it's easier to read.
27. As a user, I want the chart caption to describe daily buckets, so that the chart is self-explanatory.
28. As a user, I want the analytics modal to still show top referrers and browser breakdown after the bucketing change, so that those insights remain available.

## Implementation Decisions

- Remove Tag as a domain concept. Drop the Tag entity and the Link↔Tag join table in one migration; delete the Tag CRUD endpoints and the tag upsert helper; remove the tags field from the Link create and update request contracts and from the Link list response.
- Remove Tag from the client types and services; remove the Tags field from the Link form, the tag chips from the Link card, and tag-name matching from search; update the search placeholder to mention title, code, and URL only.
- Long URL validation: show the required error only on submit, and show the invalid-URL error only after the field loses focus (mark the field touched on blur rather than on first keystroke).
- Link card indicators: add a Max Visits indicator showing a gauge icon plus current Visits over the cap (for example 3/10), styled destructively once the cap is reached. Split the single date icon into two: Start Date uses a calendar-clock icon in blue with a "Starts {date}" tooltip; Expiration Date uses a calendar-x icon in destructive styling with an "Expires {date}" tooltip. Each is rendered only when its date is set.
- Manage Groups modal: add an always-visible New Group input at the top of the list; creating a Group emits a change event so the dashboard pill bar refreshes; update the empty-state text.
- Reset Visit Count: the reset endpoint deletes the Link's analytics rows alongside zeroing the Visit Count, so the count and the analytics history stay consistent.
- Analytics: return daily buckets for the last 30 days ending today (UTC), rendering zero-count days; remove the hourly buckets entirely. Widen the analytics modal and update the chart caption and accessibility label to describe daily buckets.
- Update the project glossary: remove the Tag term, amend Visit Count to reflect reset behavior, and update the intro sentence that references Tags.

## Testing Decisions

- Test only externally observable behavior, never implementation details.
- Backend is tested at the HTTP integration seam: the Link list response contains no tags and the Tag endpoints return not-found; Link create and update succeed without a tags field; after a reset, the analytics endpoint returns empty buckets, referrers, and browsers; the analytics endpoint returns 30 daily buckets and no hourly buckets.
- Frontend is tested at the component seam: the Link form shows no error while typing, a required error on submit, and an invalid-URL error after blur; the Link card renders the Max Visits indicator and the split date indicators and no tag chips; the Manage Groups modal creates a Group; the analytics modal shows the daily caption; the home page search ignores Tags.
- Prior art: the existing HTTP integration suites (analytics, group, and redirect tests) establish the backend seam; the existing component suites (link form, link card, manage groups, analytics modal, home) establish the frontend seam.

## Out of Scope

- Reintroducing any label or Tag concept; a future multi-label feature would be its own spec and ADR.
- Nested Groups; Groups remain flat.
- Aggregate analytics across all Links.
- CSV export of analytics data.
- Changes to Lock, Password Lock, Link Metadata, or Open Graph serving.
- Rewriting the historical dashboard-organization and analytics-and-preview PRDs; this spec supersedes the relevant decisions (see Further Notes).

## Further Notes

- Use the project vocabulary: Link, Short Code, Long URL, Title, Notes, Group, Visit, Visit Count, Max Visits, Password Lock, Start Date, Expiration Date, Lock, Link Metadata. "Tag" is referenced only as the concept being removed.
- This spec supersedes the dashboard-organization PRD's tag-related stories (Tag chips on cards, search matching Tag names) and the analytics-and-preview PRD's hourly-then-daily bucketing (story 3) and its reset semantics.
- The Tag removal is recorded as ADR-0003.

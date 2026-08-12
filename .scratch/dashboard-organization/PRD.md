# Dashboard Organization

Status: ready-for-agent

## Problem Statement

The dashboard shows every Link as a flat grid of cards, each identified only by a meaningless Short Code and a truncated Long URL. The user cannot tell Links apart at a glance, cannot organize them into Groups (the Group entity exists but is unused), and cannot sort or filter the list. The cards surface raw identifiers rather than human-readable information.

## Solution

Give every Link a mandatory, human-readable Title and redesign the card to lead with it. Introduce Groups as a filterable pill bar, with inline creation in the link form and a Manage Groups view. Add a sort dropdown. The result is a dashboard the user can scan and organize without deciphering Short Codes.

## User Stories

1. As a user, I want to give each Link a short Title when I create it, so that I can recognize it at a glance on the dashboard.
2. As a user, I want the Title to be required at creation, so that every card has a meaningful name.
3. As a user, I want the Title to be limited to a short length, so that cards stay compact and longer annotation belongs in Notes.
4. As a user, I want to see the Title as the most prominent text on each Link card, so that I can scan my Links quickly.
5. As a user, I want to see the domain of the Long URL on each card, so that I know the source of each Link.
6. As a user, I want to see a favicon for the Link's domain when metadata exists, so that I can recognize the destination at a glance.
7. As a user, I want to see the Visit Count on each card, so that I know how popular each Link is.
8. As a user, I want to see constraint icons (Lock, Password Lock, Start Date, Expiration Date) on each card, so that I know which Links have active restrictions.
9. As a user, I want to see each Link's Tags on its card, so that I understand how it is categorized.
10. As a user, I want the Short Code hidden from the card while still being copyable, so that the card is not cluttered with meaningless identifiers.
11. As a user, I want each card's actions menu to offer Copy, Edit, Analytics, and Delete, so that I can manage a Link quickly.
12. As a user, I want to create Groups to organize my Links, so that I can group related Links together.
13. As a user, I want to create a new Group inline while creating or editing a Link, so that I don't have to leave the form.
14. As a user, I want to assign each Link to at most one Group, so that organization stays simple.
15. As a user, I want to filter the dashboard by Group using a pill bar (All Links, each Group, and Uncategorized), so that I can focus on one group at a time.
16. As a user, I want an "Uncategorized" filter that shows Links not in any Group, so that I can find unorganized Links.
17. As a user, I want empty Groups to still appear in the pill bar, so that the filter remains predictable.
18. As a user, I want to see the count of Links in each Group in the pill bar, so that I know the size of each group.
19. As a user, I want a Manage Groups view where I can rename and delete Groups, so that I can maintain my organization over time.
20. As a user, I want deleting a Group to leave its Links intact (they become uncategorized), so that I don't accidentally lose Links.
21. As a user, I want to sort my Links (newest first, oldest first, most visited, alphabetical by Title), so that I can view them in the order I need.
22. As a user, I want newest-first to be the default sort, so that newly created Links appear at the top.
23. As a user, I want the sort control as a dropdown next to the search input, so that the current sort is discoverable and unambiguous.
24. As a user, I want the search input to also match Titles, so that I can find Links by the name I gave them.
25. As a user, I want to edit a Link's Title when I edit the Link, so that I can rename it later.
26. As a user, I want my existing Links to be backfilled with a Title (their Short Code) after the migration, so that no card is empty.

## Implementation Decisions

- Add a required `Title` to the Link entity with a short maximum length (60 characters), and remove the `FallbackUrl` field. Apply both in a single database migration.
- Backfill existing Link rows by setting `Title` equal to their Short Code.
- Remove `FallbackUrl` handling from the redirect endpoint; the Long URL is the sole redirect target.
- Add Group CRUD endpoints mirroring the existing Tag endpoints: create, list, rename, and delete.
- Link create and update endpoints accept a required Title and an optional Group (by id or name).
- Group deletion sets the Group reference on its Links to null, leaving the Links uncategorized.
- The Link list endpoint returns each Link's Title and Group along with existing fields.
- Card layout: Title plus favicon as the primary line; domain as the secondary line; constraint icons and Visit Count on the following line; Tags row at the bottom.
- Actions menu contains Copy, Edit, Analytics, and Delete; the Short Code is only exposed via Copy and the edit form.
- Group filter rendered as a pill bar above the grid, with "All Links" default, one pill per Group with its Link count, and an "Uncategorized" pill.
- Manage Groups is a modal listing all Groups with rename and delete actions.
- Sort dropdown next to the search input: newest first (default), oldest first, most visited, alphabetical by Title.
- Search matches Title, Long URL, and Tag names.

## Testing Decisions

- Test only externally observable behavior, never implementation details.
- Backend is tested at the API HTTP integration seam: Group CRUD round-trips, required-Title validation on create/update, absence of `FallbackUrl` in responses, group filtering and sorting of the Link list, and Title backfill behavior.
- Frontend is tested at the component seam: card rendering (Title primary, domain, favicon presence, constraint icons, Tags), the group pill bar and its filtering, the Manage Groups modal, and the sort dropdown.
- Prior art: the existing HTTP integration suite (redirect and constraint behavior) and the existing component suites (link card actions and home page) establish both seams.

## Out of Scope

- Analytics modal and its endpoint, and visit-count reset (separate spec: analytics-and-preview).
- Crawler Open Graph serving and Link Metadata repurposing (separate spec: analytics-and-preview).
- Nested Groups (Groups are flat).
- Bulk operations, link export, and group-based access control.
- Aggregate analytics across all Links.

## Further Notes

- Use the project vocabulary: Link, Short Code, Long URL, Title, Notes, Group, Tag, Visit Count, Lock, Password Lock, Start Date, Expiration Date.
- The schema migration is the shared dependency consumed by the analytics-and-preview spec; it is specified here because Title drives the card redesign.

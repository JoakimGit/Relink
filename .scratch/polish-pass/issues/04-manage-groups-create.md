# 04 — Create Group from Manage Groups

**What to build:** The Manage Groups modal allows creating a Group directly. A Group created there appears immediately in the modal's list and in the dashboard pill bar, and the empty-state text reflects that Groups can be created in the modal.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] The Manage Groups modal has a New Group input
- [x] Submitting a name creates the Group and clears the input
- [x] The new Group appears in the modal list immediately
- [x] The new Group appears in the dashboard pill bar immediately
- [x] The empty-state text no longer directs the user to the Link form to create a Group
- [x] Duplicate Group names are rejected with feedback

## Comments

Implemented in the Angular client at the component seam. `ManageGroupsModal` now shows an always-visible New Group input above the list; submitting a name calls `GroupService.createGroup`, clears the input, reloads the shared `groupsResource`, and emits `groupsChanged` so the dashboard pill bar refreshes. Empty-state text now reads "No Groups yet. Create your first Group above." A 409 Conflict maps to a "A Group with that name already exists." toast; other failures show "Failed to create group."

Tests: `manage-groups-modal.spec.ts` covers the input, create-and-clear, immediate list appearance, `groupsChanged` emission, the updated empty state, and duplicate rejection; `home.spec.ts` covers the new Group appearing in the pill bar. Full frontend suite passes (140 tests). Typecheck clean.

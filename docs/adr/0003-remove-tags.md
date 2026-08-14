# Remove Tags in Favor of Groups

The app supported both Tags (many-to-many labels) and Groups (at-most-one containers) for organizing Links, but in practice they duplicated each other: the user attached a "Manga" Tag and a "Manga" Group to the same Link. We removed Tags entirely — entity, endpoints, UI, and search — so Groups are the sole organization concept.

**Considered Options**

- Keep both and sharpen the distinction in the UI. Rejected: the overlap was structural (two categorization axes for one user), not a presentation problem.
- Merge into a single many-to-many concept. Rejected: exclusive, filterable membership is the feature actually used, and Groups already provide it via the pill bar.
- Remove Tags and keep Groups. Accepted.

**Consequences**

- Existing Tag data and the Link↔Tag join table are dropped in one migration (accepted data loss).
- Search no longer matches Tag names, and Link cards no longer show Tag chips.
- Multi-label categorization (a Link carrying several orthogonal labels) is no longer expressible; reintroducing it later would require a new ADR and schema change.

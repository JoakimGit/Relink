Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Update the `GET /{shortcode}` redirect endpoint to enforce all Link constraints before redirecting. Constraint checks happen in this priority order:

1. **Lock** — if the Link is manually locked, return an error indicating the Link is disabled
2. **Start Date** — if the current time is before the Start Date, return an error with the date the Link becomes available
3. **Expiration Date** — if the current time is after the Expiration Date, return an error with the expiration date
4. **Max Visits** — if Visit Count has reached Max Visits, return an error indicating the limit has been reached
5. **Password Lock** — if a Password Lock is set, redirect to the Angular app at `/unlock/{shortcode}`

If no constraint blocks the visit: record a Visit (increment Visit Count, insert a LinkAnalytics row), then redirect to the Long URL. If the Long URL fails, fall back to the Fallback URL.

Includes integration tests for each constraint scenario: locked, not-yet-started, expired, maxed-out, password-locked, and unconstrained success.

## Acceptance criteria

- [ ] Locked Link returns a specific error (not a generic "not found")
- [ ] Pre-Start Date Link returns error with the availability date
- [ ] Expired Link returns error with the expiration date
- [ ] Max Visits reached Link returns error with the limit info
- [ ] Password Locked Link redirects to `/unlock/{shortcode}` (Angular app route)
- [ ] Unconstrained Link records a Visit and redirects to the Long URL
- [ ] Unreachable Long URL falls back to Fallback URL if set
- [ ] Integration tests cover all constraint scenarios

## Blocked by

- [01-prefactor-api-alignment](./01-prefactor-api-alignment.md)

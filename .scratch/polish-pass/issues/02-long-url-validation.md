# 02 — Long URL validation timing

**What to build:** The Long URL field stops erroring while the user types. An empty Long URL produces the required error only when the form is submitted; a non-empty but malformed Long URL produces the invalid-URL error only after the field loses focus.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Typing in the Long URL field shows no error message while the value is incomplete
- [x] Submitting with an empty Long URL shows the required error
- [x] Leaving the Long URL field with a malformed value shows the invalid-URL error
- [x] A valid Long URL shows no error throughout

## Comments

Implemented in `Relink.Client/src/app/features/links/components/link-form-modal.ts`.

- The Long URL field now marks itself touched on `blur` instead of on every keystroke, so the invalid-URL error only appears after focus leaves the field.
- A `submitAttempted` flag drives the required error, so an empty Long URL errors only when the form is submitted; editing the field clears the flag so the error disappears while the user resumes typing.
- The submit button stays enabled while the Long URL is empty (so the required error can surface on submit), but remains disabled for a malformed value and for an empty Title.
- Added `novalidate` to the form so the browser's native `type="url"`/`required` validation doesn't preempt the custom errors.

Tests: `Relink.Client/src/app/features/links/components/link-form-modal.spec.ts` (33 tests) — typecheck and full frontend suite pass.

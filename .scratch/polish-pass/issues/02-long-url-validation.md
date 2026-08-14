# 02 — Long URL validation timing

**What to build:** The Long URL field stops erroring while the user types. An empty Long URL produces the required error only when the form is submitted; a non-empty but malformed Long URL produces the invalid-URL error only after the field loses focus.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Typing in the Long URL field shows no error message while the value is incomplete
- [ ] Submitting with an empty Long URL shows the required error
- [ ] Leaving the Long URL field with a malformed value shows the invalid-URL error
- [ ] A valid Long URL shows no error throughout

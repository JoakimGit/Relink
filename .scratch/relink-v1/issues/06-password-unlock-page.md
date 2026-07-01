Status: ready-for-agent

## Parent

[PRD: ReLink v1](../PRD.md)

## What to build

Build the Angular unlock page at the route `/unlock/:shortcode`. When a visitor hits a password-locked Link, the API redirects them to this page. The page displays a simple form with a password input and a submit button. On submit, it sends the password to an API endpoint for validation. If the password is correct, the visitor is redirected to the Long URL. If incorrect, an error message is shown.

The page should be visually clean and focused — just the password prompt, no app chrome or navigation. Include a note that this Link is password-protected.

Includes component tests that verify password submission, success redirect, and error display.

## Acceptance criteria

- [ ] `/unlock/:shortcode` route renders the unlock page
- [ ] Page shows a message indicating the Link is password-protected
- [ ] Password form with input and submit button is displayed
- [ ] On correct password, visitor is redirected to the Long URL
- [ ] On incorrect password, an error message is shown
- [ ] Page has no app navigation/chrome — focused prompt only
- [ ] Component tests verify success redirect and error display

## Blocked by

- [05-redirect-constraint-enforcement](./05-redirect-constraint-enforcement.md)

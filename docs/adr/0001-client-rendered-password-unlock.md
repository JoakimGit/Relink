# Client-Rendered Password Unlock for Password-Locked Links

Password-locked Links require visitors to enter a password before being redirected. We chose to handle this client-side in the Angular app rather than server-rendering a password page from the API.

When a visitor hits `/{shortcode}` for a password-locked Link, the API redirects them to the Angular app at `/unlock/{shortcode}`. The Angular app renders the password form, validates against the API, then redirects to the Long URL on success.

**Considered alternative:** Server-render the password page directly from the API. Rejected because it would require the API to serve HTML (blurring the API/UI boundary) and would create two separate password UI implementations — one server-rendered, one in the Angular management app.

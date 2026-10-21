# Relay private Reddit connection

Owner-private Sites authentication bridge for the GitHub Pages reader. It supports confidential Reddit web apps with authorization-code exchange and optional server-side refresh, plus script apps with application-only client credentials.

The fixed return/Reddit redirect URL is https://mikolajwichrowski.github.io/reddit-relay/ . No arbitrary redirect destinations or public CORS proxy are accepted. Start sign-in from the reader so its local one-time OAuth state exists.

Client credentials are entered only on the private setup form and sent over HTTPS. Optional remembered credentials/refresh tokens are AES-GCM encrypted into Secure, HttpOnly, SameSite=Lax cookies tied to the authenticated Site user. The encryption key is a Sites runtime secret named BROKER_COOKIE_KEY; it is never tracked. Credential cookies expire in 30 days and transaction cookies in ten minutes. Form submissions require same-origin Origin and a transaction nonce. Tokens return only to the fixed reader origin; the reader validates state and strips the fragment.

`npm test` covers web exchange, script tokens, encrypted remembering, refresh, fixed redirects, identity, CSRF, and state checks with mocked Reddit responses. `npm run build` creates the deployable ESM Worker artifact. No package installation or runtime dependency is required.

Site access must stay owner-private. Source helper binaries were unavailable in the authoring environment; source was committed and pushed with the native source credential passed through stdin, then the verified dist artifact was packaged for the native Sites deployment API.

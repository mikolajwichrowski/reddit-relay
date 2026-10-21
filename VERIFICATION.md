# Verification

The UI repair passes Chromium checks at 320, 375, 390, 430, 768, and 1440px widths:

- No horizontal overflow or collision between feed title and header actions.
- On mobile the first post starts within 160px of the top; the tab bar remains under 80px.
- Top sorting with the time selector fits without overflow.
- Inline image galleries, community selection/addition, long search queries, dark settings, saved posts, and mocked token connect/disconnect work.
- Four SVG tab icons render; no JavaScript exceptions occur in the tested flow.
- Mobile feed, dark settings, and desktop screenshots were visually inspected.

Run `node scripts/check-ui.cjs` with Playwright installed. Screenshots are written to `ui-screenshots/`; GitHub Actions runs the same checks and attaches the images as an artifact before publishing Pages. `npm test` covers media resolution and viewport playback thresholds.

Reddit responses and media are fixtures in the browser layout checks. Native autoplay and persistent sound passed Chromium checks in the preceding revision. Live Reddit authorization, third-party playback, and physical iOS device behavior remain unverified.

## iOS chrome and OAuth update

Unit tests cover OAuth URL construction, mismatched/missing state, expired requests, cancellation, token type, expiry, and read permissions. Browser checks also pass a simulated Reddit permission redirect through the real app, verify the token is received, strip the fragment, consume state, and disconnect. Dark-theme status-bar metadata and the Reddit app-registration link are asserted. The iOS safe-area background is opaque and the root/theme color is restored before rendering; physical Dynamic Island behavior is not tested in Chromium.

## Existing-client authentication service

The owner-private service is deployed with Sites. Its tests cover code exchange, refresh reuse, script client credentials, encrypted cookies, fixed return URLs, identity, bad Origin/CSRF, tampering, and state rejection. The reader’s browser test simulates the broker round trip through a query-code callback and final fragment token, then verifies address-bar cleanup. Live Reddit credentials were not supplied, so real account authorization is not verified.

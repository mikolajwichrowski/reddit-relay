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

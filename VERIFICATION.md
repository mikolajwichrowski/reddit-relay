# Verification

Passed in Chromium at a 390 × 844 mobile viewport:

- Explicit demo shows four posts.
- Saving a post updates the saved view and survives a reload.
- Preferences open and dark appearance toggles.
- Post viewer opens and closes.
- No horizontal overflow or JavaScript exceptions in this flow.
- Service worker registers; after switching the browser offline, reloading the shell and opening saved posts succeeds.

`npm test`, `node --check app.js`, and `node --check sw.js` also passed.

Live Reddit requests were blocked deliberately in the browser smoke check to exercise the failure/demo path. Live API access, actual external media playback, device-specific codecs, and install prompts on physical iOS/Android devices remain unverified. The repository upload is separate from validation. A successful GitHub Pages deployment is still required to activate the launch URL.

# Verification

## Glass UI and inline playback update

Passed in headless Chromium at a 390 × 844 mobile viewport, with real H.264/AAC video served through controlled media routes and mocked Reddit responses:

- Native videos render inline, actually play while visible, and start muted.
- Scrolling to another video pauses the first.
- Sound toggle applies across videos and survives reload.
- Opening Preferences pauses background videos.
- Both gallery items are present inline; a GIF is rendered in the feed.
- Token verification (mock identity), optional local persistence, restore, and disconnect work.
- Saved posts survive reload and remain accessible with the browser offline.
- No JavaScript exceptions or horizontal overflow in the tested mobile flow.
- Desktop layout at 1440 × 1000 has no horizontal overflow.

`npm test`, `node --check app.js`, and `node --check sw.js` pass. Unit checks cover media resolution, animated previews, self-post attachments, malicious URLs, gallery/crosspost handling, query encoding, and viewport visibility thresholds.

Live Reddit authorization, external YouTube/Vimeo playback, HLS/DASH audio, device-specific codecs, and installation on physical iOS/Android devices remain unverified. Browser audible-autoplay restrictions may require tapping Play; the app keeps the chosen sound preference. GitHub Pages deployment is verified separately through its workflow.

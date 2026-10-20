# Relay

A mobile Reddit reader with a compact feed header, community picker, stable tab navigation, consistent SVG icons, and inline media. Glass is reserved for navigation; posts use solid surfaces for contrast. Vanilla JavaScript, static files, no build, no account system, no database.

**[Click here to open Relay](https://mikolajwichrowski.github.io/reddit-relay/)** — intended GitHub Pages URL. This link becomes live after you publish the repository and enable Pages below; it is not a deployment confirmation.

## Publish to GitHub

GitHub Pages is the static hosting you want. Raw GitHub files cannot run an installable PWA directly. Pages serves these files over HTTPS, with no application server to manage.

1. Create a public repository named `reddit-relay` under your account. If you use another owner/name, update the launch link above.
2. Push this folder to its `main` branch, including `.github/workflows/pages.yml`:

   ```sh
   git remote add origin https://github.com/mikolajwichrowski/reddit-relay.git
   git push -u origin main
   ```

3. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
4. In **Actions → Publish Relay**, run the workflow if necessary. Its deployment output contains the actual live URL.
5. Click the launch link above. Subsequent pushes to `main` update the app automatically.

To create and publish with an authenticated GitHub CLI instead:

```sh
gh repo create reddit-relay --public --source=. --remote=origin --push
```

You still need to enable Pages with GitHub Actions. Source files are published in this repository. Enable GitHub Pages as described above to serve the app; the launch link is live only after a successful Pages deployment.

## Run locally

```sh
npm start
```

Requires Python 3. Open **http://localhost:8080**. Alternatively run `python3 -m http.server 8080` in this folder. Do not open `index.html` as a `file://` URL: modules and service workers require HTTP/HTTPS. There are no npm packages to install. Node 20+ runs `npm test`.

## Install on your phone

- **iPhone/iPad:** open the HTTPS Pages URL in Safari → Share → Add to Home Screen.
- **Android:** open in Chrome → Install app / Add to Home Screen. An Install button appears when the browser offers installation.
- **Desktop:** use the browser address bar’s install icon, when available.

The manifest uses relative paths so repository subpaths work. The app has its own 192/512px icons and standalone display mode.

## What it does

- Explore popular/all/community feeds; search Reddit; sort Hot, New, Top and Rising; top time ranges and pagination.
- Open posts and read the first available comments. Full conversations open on Reddit.
- Add communities and switch between them on desktop or mobile. Search also accepts `subreddit:CommunityName`.
- Save up to 200 posts locally, switch compact layout, dark mode, blur spoilers/mature media.
- Mature content is opt-in with an 18+ confirmation. This changes filtering, not Reddit’s authorization rules.
- Export/import JSON backups and clear local data in Preferences.
- Clearly labeled demo content lets you inspect the reader when live Reddit is unavailable. Demo photos are from Unsplash; the example video is Big Buck Bunny on YouTube.

## Media support and limits

| Media | Handling |
| --- | --- |
| JPEG, PNG, GIF, WebP, AVIF, SVG, BMP | Browser-native images, subject to browser codec support |
| Reddit galleries, crossposts, animated galleries | Gallery viewer with horizontal swipe; original animated source where supplied |
| MP4, WebM, Ogg, MOV | Native HTML video; actual codec support varies by browser |
| Reddit HLS / `.m3u8` | Native HLS on supporting browsers; bundled hls.js elsewhere |
| MPEG-DASH / `.mpd` | Bundled dash.js with Media Source support |
| Reddit video audio | Adaptive stream includes sound when Reddit exposes it; direct MP4 fallback can be silent |
| YouTube, Shorts, Vimeo | Inline players, loaded as they enter view; provider autoplay rules apply |
| Redgifs, Gfycat, Imgur pages, other hosts | Preview when provided and original-source link; no scraping or proxy |
| Unsupported, removed, expired, private, DRM, age-gated media | Original-source fallback; playback cannot be guaranteed |

No static reader can promise **all Reddit content or every external media format**. Reddit may deny anonymous JSON requests, browser CORS access, hosted networks, NSFW data, private communities, or expired tokens. Restrictions cannot be bypassed by GitHub Pages. Live availability has not been verified in the authoring environment. See [Reddit developer access information](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data) and [API documentation](https://www.reddit.com/dev/api/).

Users with approved Reddit API access can paste a bearer token into **Preferences → Reddit connection → Connect & verify**. Relay verifies identity, or read access for tokens without the identity scope, before using it. Tokens are sent only to `oauth.reddit.com`. By default the token stays in memory and disappears on reload. **Remember on this device** explicitly opts into local storage under `relay.access-token`; backups exclude it. Disconnect deletes it. Relay cannot create access tokens: obtain one through your approved Reddit API application’s OAuth flow. Never enter a password/client secret. Relay does not implement OAuth registration, token issuance, or renewal. A token does not guarantee mature-content access. There is no public CORS proxy and no backend.

## Inline playback and sound

Images display uncropped in the feed. Galleries swipe inline, including animated/video items; self-post image attachments are also rendered. Reddit GIF-to-MP4 previews are preferred when supplied for controllable looping playback. Raw GIFs load in view and unload offscreen, restarting when revisited.

Native video, Reddit HLS/DASH, GIF video previews, and supported YouTube/Vimeo embeds start when sufficiently visible and pause offscreen. Background tabs and open sheets pause feed playback. Native streaming players initialize lazily and are disposed when posts are replaced.

Sound is **off by default**. The feed sound control, per-player button, Preferences switch, and native video mute controls share the same `soundOn` local preference. Once enabled, sound stays enabled across posts and reloads until you turn it off. On iOS or other browsers that block audible autoplay, a **Tap to play** button appears; the app preserves your preference instead of silently resetting it. Provider restrictions can still require their own play gesture. Mature/spoiler media remains behind the configurable reveal control.

## Storage, privacy, offline behavior

Bookmarks, community names, and preferences use `localStorage` under `relay.v1`. Saved post text and media URLs remain on this device until cleared; clearing browser data removes them. A backup contains saved content and should be treated as personal data. Cross-device sync is intentionally absent.

The service worker caches only the same-origin application shell and bundled playback libraries using the browser’s Cache Storage API (required for offline PWA behavior). It does not cache API responses, access tokens, or external media. After the first successful visit, the shell and saved post metadata work offline; new feeds, images, videos, and comments require internet access. Browser updates activate once old app tabs close. Bump `relay-shell-v3` in `sw.js` when changing the cache contents.

No analytics or application server. Network requests go directly to Reddit, chosen media providers, Unsplash for demo photos. Supported third-party embeds load when scrolled into view, connecting directly to their provider. The UI uses system fonts without font-service requests.

## Development

`app.js` owns UI and local state; `media.js` resolves media and API URLs; `playback.js` coordinates viewport playback, `icons.js` provides local SVG icons, and `sw.js` provides offline shell caching. `npm test` checks media resolution, hostile URLs, gallery/crosspost handling, search encoding and mature/auth request flags. Manual checks: phone viewport navigation, install on a real HTTPS origin, offline saved posts, blocked Reddit error state, and audio/video on your target devices.

Vendored playback dependencies: **hls.js 1.6.13** (Apache-2.0, `vendor/HLS-LICENSE`) and **dash.js 5.0.3** (BSD-3-Clause, `vendor/DASH-LICENSE`). No CDN runtime dependency for playback. Project code is MIT licensed. This is an independent reader, not affiliated with Reddit.

GitHub Pages setup reference: [Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Interface checks

The layout follows familiar Reddit reader patterns, using [Apollo](https://apolloapp.io/clockwise/) and [Apple’s material guidance](https://developer.apple.com/design/human-interface-guidelines/materials) as references. The original layout uses a compact header, full-width posts, and a community sheet.

`node scripts/check-ui.cjs` runs Playwright checks at six viewport widths and saves screenshots to `ui-screenshots/`. Install Playwright separately for development: `npm install --no-save --package-lock=false playwright`, then `npx playwright install chromium`. The Pages workflow runs these checks before deploying.

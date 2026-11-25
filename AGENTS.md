# Agent notes (website)

Read `DESIGN-RULES.md` first; it is the source of truth for this site and overrides defaults.

> **Archived 25 Nov 2026.** The island-era files (old place photographs, phone captures, motion loops, `previews/`, and the scripts `check-parity.py`, `check-light-switch.cjs`, `reveal-colours.py`, `steady-loop.py`, `build-motion.py`, `scripts/capture-app/`) left the repo; they stay in git history before this commit and in the founder's local archive. Notes below that name them are history, not current instructions.

## What this is
The public pre-launch site for Urge Walk at **https://urgewalk.app** (GitHub Pages custom domain since Nov 9 2026; the old `dariusdtatum-tech.github.io/urgewalk/` address redirects; `urgewalk.com` is also registered), rebuilt on Nov 8 2026 as a walk across the island and, from Nov 25 2026, as **a book** (see "25 Nov 2026" in `DESIGN-RULES.md`; the island sections below are history). Plain static files, no build step: one stylesheet (`book.css`), two scripts (`book.js`: the opening and the browser-bar colour; `site.js`: Island light, the tools, Keep it, progressive enhancement only), and the pages. The same inline script in every page's head sets `html[data-light]` (Island light) and `html.js` before the stylesheet paints; its CSP hash is the same on every page.

## Files
- **Cache (25 Nov 2026).** Pages load `book.css`, `book.js` and `site.js` with `?v=rN`; bump that and `sw.js` VERSION together on any change to them, so returning visitors never keep an old stylesheet (the founder saw the old Plate I after #48). The service worker precaches with `cache: 'reload'` so it never copies a stale HTTP-cached file.

- **Every page is the book (25 Nov 2026).** `privacy`, `terms`, `support`, `helpers`, `premium`, `community`, `404`, `walk`, `breathe`, `ground`, `ride` share one header (Help 988 pill to the page's own `#help`), one footer and `book.css`. `site.css` and `places.css` were deleted (no page used them). Under it, the older bullets below describe the island and are history where they mention veils, places or `places.css`; `site.js` still carries dead island code (places, arrival, reveal) that finds nothing and does nothing; trimming it is safe but not done. `scripts/reveal-colours.py`, `check-parity.py` and `check-light-switch.cjs` were written for the island and are stale. `community.html` is new. The home's Plates II to IV are app captures in `assets/screens/book/` (`data-capture`); the Watch plate is text only. `sw.js` precache was changed (VERSION `uw-2026-11-25-r2`): the deleted CSS is gone from it, and Privacy, Terms and Community are in.
- `index.html` — **the book** (25 Nov 2026, replaces the island walk; see "25 Nov 2026: the book" in `DESIGN-RULES.md`). Styles in `book.css`, the skip in `book.js`; `site.js` still loads for Island light and the Keep-it-on-your-phone block. A cloth cover and Ex Libris endpaper play once per session on `/` only (head script adds `html.opening`; CSS timeline 3.6 s; tap or Esc skips; none without JS, under Reduce Motion or Save-Data). Then a two-page spread on wide screens (endpaper left, Plate I right), one page on phones, then Plates II to IV, the privacy sentence, Help, Community, Keep it. Paper tiles and cloth noise are in `assets/paper/`. The old walk's CSS (`.place`, `.arrival`, `places.css`) stays for the other pages until they move to the book. Every edit to the head inline script needs the CSP hash recomputed.
  (Earlier, replaced:) the island walk, which opened on the arrival; each place was a `<section class="place …">`.
- `ride.html` — Ride one out (Nov 9): a 90-second pass at the Shore over 4K motion (`assets/motion/shore-{2160,1440,phone}.mp4`, posters `.jpg`); in evening light (Nov 14) it plays `shore-evening-{tall,wide}.mp4` with the `.webp` posters, and a light switch during a pass waits for the next Start. A veil in the Shore's `--deep` sits only behind the wave, the scale and the 988 line. Without JavaScript: the Shore still, the whole wave and a calm line instead of Start. `sw.js` never caches `.mp4` or range requests. Rules in `DESIGN-RULES.md`.
- `tests/ride-light.test.mjs` — Playwright test for which sea Ride one out plays in each light (injected clock; `node tests/ride-light.test.mjs` after `npm i --no-save playwright`). Dev-only, not part of the site.
- `breathe.html`, `ground.html` — free tools; `tools.json` holds the breath timings and the grounding steps (shared with the app's wording).
- `support.html`, `privacy.html`, `terms.html`, `helpers.html`, `premium.html` — reading pages. Privacy, Terms and Support are linked from the app: never rename them.
- `assets/places/` — web-size place crops (Unsplash+, credited in the footer; built by the app repo's `scripts/island/build-site-images.py`). `assets/screens/` — captures of the current app with sample data. `assets/og.jpg` — the link-sharing image.
- `scripts/check-hidden-unicode.sh` — CI guard.

## "Make it better" rounds (Nov 9 2026)
Founder's prompt, applied five times: "Look at the site first. Then innovate: think about the user experience and think outside the box. Make one bold change that improves conversions or the look and feel, not a small tweak. Use any tool you have. You must ship a change every time."
1. **Walk on the web** (`walk.html`, the Path Ahead): 5/10/15 minutes or open; wall-clock timer; Wake Lock where allowed; the app's kind walk lines every 2 minutes; Pause/Resume, Finish; "What did the urge do?" Passed / Eased / Stayed; Stayed shows 988, Breathe and findahelpline. Nothing saved or sent. PR #10.
2. **Ride it out on every page**: a glass button opens a native `<dialog>`: Walk, Breathe, Ground, Talk to someone (988), findahelpline. PR #11.
3. **Keep it on your phone**: `manifest.webmanifest`, icons 192/512, iOS metas, offline `sw.js` (bump `VERSION` when the precache list changes); a "Keep it on your phone" card at night. PR #12.
4. **The island as a map**: `.isle` card on wide screens, drawn by `island_map.py` in the generator; the route draws in the place's colour as you scroll. Phones: a 2 px progress line. PR #13. **Removed Nov 10** (founder: remove the Tide Pool box entirely); the 2 px line now runs on every screen width.
5. **The night as a next step**: Tell me when it's out (mailto hello@urgewalk.app), Send it to someone (Web Share, else copy), Keep it on your phone. The hero's "Coming to iPhone." links to it. PR #14.

Then "one change per round" (Goal: the launch email; limit +100 lines):
6. **The Goal on the first screen**: the hero's foot is now "Tell me when it's out" (one prefilled mailto, `LAUNCH_MAIL`, shared with the night) instead of a link down to it. PR #15.
7. **Hero photo first**: `html.lazy-places` (head script; not under Reduce Motion or without IntersectionObserver) hides every place photograph except the current place and its neighbours (`.near`, set in `mark()`), so the hero's photo stops competing with eight others. Throttled phone, local: hero photo 3.2 s → 2.1 s. PR #16.

Matching the app (Nov 9, app rounds 1 and 8): Ground opens on its first sense (no intro or Start; Back is off on sense 1, Start again returns to sense 1), and the Ride it out dialog appears without an entrance animation.

## App first (Nov 10, proposal in PR)
Founder: "i want people to be focused on the app". The homepage is re-composed so the phone is the subject and the island the setting: the arrival is the hero (what it is, "Urges pass, like waves.", the ask as a button, and the app's first screen, "You're here.", in a phone; founder, Nov 10: the first phone a visitor sees is the app's real first screen, and Home moved to the Sheltered Coast); then the Sheltered Coast (the app's first screen: "You're here.", 18 or older, Continue; added Nov 10 after the founder: "the website doesn't show the arrival screenshot"), the Clearing (Ride it out), the Path (Walk), the Tide Pool (the live breath), the Shore (Ground), the Outlook (History), the Cottage (private), Night. The separate Coast screen, the Cove and the Shelter left the homepage (their photographs still serve other pages).
- Every app screen has a daylight and an evening capture (`<name>.webp`, `<name>-evening.webp`, and since Nov 15 a recording of each, `.mp4` and `-evening.mp4`), shown by Island light (`img.is-day` / `img.is-evening`, `data-motion` / `data-motion-evening`). The arrival has one version: the app's arrival is a single daylight clip. Media table: PR #23.
- `assets/screens/` (Nov 16, app `66c2009`; History re-recorded at `39c9261`, the daylight Walk at `376b215`): every phone moves and follows Daylight · Evening. `arrival` (one version), `home`, `ride`, `walk`, `breathe`, `ground`, `history`, each a `.webp` still (390 × 844, the loop's first frame) and an `.mp4` loop (390 × 844), plus `-evening` versions. Recorded from the app's web build with invented sample data: `scripts/capture-app/` (puppeteer-core, Chrome, ffmpeg from imageio-ffmpeg; `encode.py d16 e16`). A `<figure class="phone" data-motion="…mp4" data-motion-evening="…mp4">` plays while on screen and `html.moving` is set (`syncPhones` in `site.js`); otherwise the still shows.
- After any change to the app's places or glass, run the two checks (founder, Nov 16: "Not every visual is the same"): `python -I scripts/check-parity.py` (every place picture is the app's, read from the app's Git) and `node scripts/check-light-switch.cjs <url>` (every picture follows the switch, on every page, at 390 and 1440 px). Re-record the phones if the app's look changed.
- **Security headers live in each page's head** (Nov 16 audit; GitHub Pages can't send headers): `<meta charset>` first, then a Content-Security-Policy and `<meta name="referrer" content="no-referrer">`. The CSP allows inline scripts only by their sha256 hash, taken after CRLF becomes LF (browsers hash the normalised text). **Any edit to an inline `<script>` needs its page's hash recomputed**, or that script silently stops running; the light-switch check catches the head script, and the Ground and Ride body scripts need a look in the console.
- `404.html` (Nov 16) uses `<base href="/">` so its links and pictures work at any depth; `robots.txt` allows all while every page carries noindex. At launch: drop noindex, add `sitemap.xml` and its line in robots.txt.
- The floating Ride it out button sits right after the header in each page's markup (second in the Tab order, Nov 16 audit) and steps aside (`html.fab-aside`) while it would cover a tool's own buttons.
- The Coast loops are back with the arrival section; the Cove has stills only (For helpers band).

## Living places (Nov 10)
The app's still-camera loops move the site: Coast, Clearing, Path Ahead, Tide Pool (`inlet`), Shore, Cove and Outlook, each per light, on `index.html`, `breathe.html`, `ground.html` and `walk.html`. Files in `assets/motion/`: `{place}[-evening]-{wide,tall}.mp4` (1280 × 720 / 720 × 1280, ≤ 2 Mb/s, ~1–3 MB) and a `.webp` poster that is the loop's own first frame; `arrival-{wide,tall}.mp4` with `-end.webp`. Built by `scripts/build-motion.py`: wide loops cut from Pixabay's 1080p renditions of the app's footage (sources and trims in the script; the daylight Path, Nov 16, from the 4K Pexels original in the private Sources folder, with a crop window that leaves out a towel), tall loops are the app's own loops scaled down. Outlook daylight has no wide loop (Nov 16: the app's tower clip is upright), so wide screens show a still band of it.
- The head script sets `html.moving` unless Reduce Motion, Save-Data, 2G, or the footer's "Motion off" (`localStorage` `urgewalk.motion`). With it, `site.css` swaps each place's `--img-*` for the loop's poster; `site.js` (`syncMotion`) gives footage only to the current place and its neighbours and plays only the current one; others are released.
- Stills match the app (Nov 10, founder: "that lighthouse view isnt there anymore"): a place that moves in the app is always pictured by its footage's first frame (`html:root [data-place=…]` in `site.css` overrides `places.css`), on every page, whether or not the footage plays. Outlook daylight on wide screens is a still of the same view (`outlook-wide.webp`); the Cove (For helpers band) has stills only. The older Unsplash+ crops for those places in `assets/places/` are no longer shown (still referenced by the generated `places.css`). Cottage, Shelter and Trailhead keep their photographs, as in the app.
- Without `html.moving` nothing plays, and the arrival is its last frame.

## How Island light works
The head script picks `day` (5:00–16:59 local) or `evening`, or the visitor's saved choice (`localStorage` key `urgewalk.light`). `places.css` maps `[data-place=…]` to that light's `--img-wide`, `--img-tall`, `--tone` and `--deep`; only the matching photographs load. The header switch changes it live. Without JavaScript the site shows daylight.

## How the walk works
`site.js` adds `html.walk` (unless Reduce Motion is on), which fixes every place's photograph behind the page; an IntersectionObserver marks the place crossing the middle of the screen `.here`, and CSS fades its photograph in (520 ms). The trail index (`.trail`, wide screens) gets `aria-current`. Without the script, the page is ordinary stacked sections.

## Domain
- urgewalk.app and urgewalk.com registered by the founder at Cloudflare Registrar (Nov 9 2026). urgewalk.app DNS: four A (185.199.108–111.153), four AAAA (2606:50c0:8000–8003::153) and `www` CNAME to `dariusdtatum-tech.github.io`, all DNS only (not proxied, so GitHub issues the HTTPS certificate). `CNAME` file in this repo holds `urgewalk.app`; never delete it.

## Rules that bite
- Contact address: hello@urgewalk.app (founder, Nov 9), forwarded by Cloudflare Email Routing to the founder's private inbox (address not recorded in the public repo). The site generator replaces any older address.
- Night is never navy: it is the page's place's `--deep` (set by `data-place` on `<body>`).
- Keep the `noindex` meta until launch. No fake App Store badge.
- Never commit original or full-size photographs; never add images a page doesn't use.
- Changing a tool's wording: change `tools.json` and keep it in step with the app.
- Record every change in the app repo's project record (`urge-walk-app/docs/project-record/`). From Nov 15, site work is recorded here in `records/` (founder, via the main session).

## Working agreement (founder, Nov 9 2026)

"Yeah merge any small verified site fixes then." Small, verified fixes to this site are merged by the agent without asking, then reported. Larger changes (a new direction, a new page such as Ride One Out going live) still wait for "merge".

## Before you open a PR

These steps sit alongside the rules above; they do not replace them.

1. Look up current HTML, CSS and JavaScript patterns in Chrome's Modern Web Guidance before writing new front-end code:
   - Search: `npx modern-web-guidance@1.0.0 search <topic>`
   - Read a guide: `npx modern-web-guidance@1.0.0 retrieve <guide-id>`
   - The version is pinned (1.0.0, the one the first check ran on). Bump it on purpose, in its own commit, after reading what changed.
   - Repo: https://github.com/googlechrome/modern-web-guidance
2. Before using any newer platform feature, confirm it works in iPhone Safari (caniuse.com or MDN), or add a fallback. iPhone Safari comes first.
3. Run the quality check from the repo root and paste its summary into the PR:

   ```bash
   npm install
   npm run check
   ```

   `./tools/check.sh` does the same, and runs `npm install` on the first use. The check is local and free. Do not add a GitHub Action for it while the Actions minutes limit is in effect (until 1 December 2026). The Modern Web Guidance scan is advice; the check fails on axe violations, a Lighthouse accessibility score under 95, broken internal links or assets, console errors, horizontal overflow at 390px, or a personal Google mail address in tracked files.
4. One editor per repo at a time. Use single-purpose commits. Merging follows the working agreement above: small, verified fixes are merged by the agent and reported; anything larger waits for the founder's "merge".

## The home book (25 Nov 2026, r6)
`index.html` is generated once by hand from the pattern: `.pair` (two `.pg` leaves), `.pp` (a plate spread: plate + words), `.pg` (one leaf). `book.js` does turning, folio, hash, keys, wheel, loops and the Watch picker; tests: `node tests/book.test.mjs` (needs system Chrome; H.264). Loops in `assets/motion/book/` are the app's own clips (720x1280 H.264, no audio, 0.3 to 2.0 MB; posters are their first frames), cut from `urge-walk-ios/PrivateAssets/Loops` and, for the Shelter, `urge-walk-ios-shots/media-originals/app/Scenes`: Path day Pixabay 134204 (Peter Florea), Path evening Pixabay (the app's Walk evening), Still Pool day Pexels 29646860 (Lauri Poldre), evening Pixabay 217236 (AVISIONfx), Shore day Expo's Pixabay footage, evening Pexels 29111562, Cove Pixabay 44969 and 199001, Outlook day Pexels 32448186, evening Pixabay 216997, Shelter day Pexels 32737017 (Green_), evening Pexels 38531723 (Manjit); all under the Pixabay Content License or the Pexels License. The Way On (Unsplash JlOoi1SoGT4, v3PZEEwnv9w) and the Cottage are the app's stills. The Watch plate is the approved drawn watch with the real Watch capture (`assets/watch/ride-it-out.jpg`, 14 KB). Never precache `.mp4`.

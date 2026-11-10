# Agent notes (website)

Read `DESIGN-RULES.md` first; it is the source of truth for this site and overrides defaults.

## What this is
The public pre-launch site for Urge Walk at **https://urgewalk.app** (GitHub Pages custom domain since Nov 9 2026; the old `dariusdtatum-tech.github.io/urgewalk/` address redirects; `urgewalk.com` is also registered), rebuilt from nothing on Nov 8 2026 as a walk across the island. Plain static files, no build step: one stylesheet (`site.css`), a generated one (`places.css`: each place's colour and photographs per light), one script (`site.js`, progressive enhancement only), and the pages. An inline script in every page's head sets `html[data-light]` (Island light) before the stylesheets paint.

## Files
- `index.html` — the walk. It opens on **the arrival** (`<section class="arrival">`, Nov 10): a boat nearing a sunlit rocky island (Pixabay 59046, as in the app), played once, resting on its last frame, then "You're here. / Come ashore". Each place is `<section class="place c-…" id="…" data-place="…">` with a `.place-bg` (CSS background from `places.css`), a `.veil` in the place's deep shade only where the words are, and its own composition class (`c-hero`, `c-clearing`, `c-path`, `c-pool`, `c-shore`, `c-cove`, `c-shelter`, `c-outlook`, `c-cottage`).
- `ride.html` — Ride one out (Nov 9): a 90-second pass at the Shore over 4K motion (`assets/motion/shore-{2160,1440,phone}.mp4`, posters `.jpg`); `sw.js` never caches `.mp4` or range requests. Rules in `DESIGN-RULES.md`.
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
Founder: "i want people to be focused on the app". The homepage is re-composed so the phone is the subject and the island the setting: the arrival is the hero (what it is, "Urges pass, like waves.", the ask as a button, and the app's Home in a phone); then the Clearing (Ride it out), the Path (Walk), the Tide Pool (the live breath), the Shore (Ground), the Outlook (History), the Cottage (private), Night. The separate Coast screen, the Cove and the Shelter left the homepage (their photographs still serve other pages).
- `assets/screens/`: captures of the current app (web build, 390 × 844, seeded sample data, never the founder's own): `home`, `ride`, `walk`, `ground`, `history` `.webp`, and `home.mp4`, `walk.mp4` (8 s recordings, 390 × 844). A `<figure class="phone" data-motion="…mp4">` plays its recording while on screen and `html.moving` is set (`syncPhones` in `site.js`); otherwise the capture shows. Capture script: the private Sources folder for Nov 10 (`site-app-first/shoot.cjs`).
- Coast and Cove loops were removed from `assets/motion/` (no page uses them); Cove stills came back for the For helpers band.

## Living places (Nov 10)
The app's still-camera loops move the site: Coast, Clearing, Path Ahead, Tide Pool (`inlet`), Shore, Cove and Outlook, each per light, on `index.html`, `breathe.html`, `ground.html` and `walk.html`. Files in `assets/motion/`: `{place}[-evening]-{wide,tall}.mp4` (1280 × 720 / 720 × 1280, ≤ 2 Mb/s, ~1–3 MB) and a `.webp` poster that is the loop's own first frame; `arrival-{wide,tall}.mp4` with `-end.webp`. Built by `scripts/build-motion.py`: wide loops cut from Pixabay's 1080p renditions of the app's footage (sources and trims in the script), tall loops are the app's own loops scaled down. Outlook daylight has no wide loop (a boat crosses the wide frame), so wide screens keep its photograph.
- The head script sets `html.moving` unless Reduce Motion, Save-Data, 2G, or the footer's "Motion off" (`localStorage` `urgewalk.motion`). With it, `site.css` swaps each place's `--img-*` for the loop's poster; `site.js` (`syncMotion`) gives footage only to the current place and its neighbours and plays only the current one; others are released.
- Stills match the app (Nov 10, founder: "that lighthouse view isnt there anymore"): a place that moves in the app is always pictured by its footage's first frame (`html:root [data-place=…]` in `site.css` overrides `places.css`), on every page, whether or not the footage plays. Outlook daylight on wide screens is a still of the same view (`outlook-wide.webp`); the Cove (For helpers band) has stills only. The older Unsplash+ crops for those places in `assets/places/` are no longer shown (still referenced by the generated `places.css`). Cottage, Shelter and Trailhead keep their photographs, as in the app.
- Without `html.moving` nothing plays, and the arrival is its last frame.

## How Island light works
The head script picks `day` (6:00–17:59 local) or `evening`, or the visitor's saved choice (`localStorage` key `urgewalk.light`). `places.css` maps `[data-place=…]` to that light's `--img-wide`, `--img-tall`, `--tone` and `--deep`; only the matching photographs load. The header switch changes it live. Without JavaScript the site shows daylight.

## How the walk works
`site.js` adds `html.walk` (unless Reduce Motion is on), which fixes every place's photograph behind the page; an IntersectionObserver marks the place crossing the middle of the screen `.here`, and CSS fades its photograph in (520 ms). The trail index (`.trail`, wide screens) gets `aria-current`. Without the script, the page is ordinary stacked sections.

## Domain
- urgewalk.app and urgewalk.com registered by the founder at Cloudflare Registrar (Nov 9 2026). urgewalk.app DNS: four A (185.199.108–111.153), four AAAA (2606:50c0:8000–8003::153) and `www` CNAME to `dariusdtatum-tech.github.io`, all DNS only (not proxied, so GitHub issues the HTTPS certificate). `CNAME` file in this repo holds `urgewalk.app`; never delete it.

## Rules that bite
- Contact address: hello@urgewalk.app (founder, Nov 9), forwarded to urgewalk@gmail.com by Cloudflare Email Routing. The site generator replaces any older address.
- Night is never navy: it is the page's place's `--deep` (set by `data-place` on `<body>`).
- Keep the `noindex` meta until launch. No fake App Store badge.
- Never commit original or full-size photographs; never add images a page doesn't use.
- Changing a tool's wording: change `tools.json` and keep it in step with the app.
- Record every change in the app repo's project record (`urge-walk-app/docs/project-record/`).

## Working agreement (founder, Nov 9 2026)

"Yeah merge any small verified site fixes then." Small, verified fixes to this site are merged by the agent without asking, then reported. Larger changes (a new direction, a new page such as Ride One Out going live) still wait for "merge".

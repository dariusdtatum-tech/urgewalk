# Agent notes (website)

Read `DESIGN-RULES.md` first; it is the source of truth for this site and overrides defaults.

## What this is
The public pre-launch site for Urge Walk at **https://urgewalk.app** (GitHub Pages custom domain since Nov 9 2026; the old `dariusdtatum-tech.github.io/urgewalk/` address redirects; `urgewalk.com` is also registered), rebuilt from nothing on Nov 8 2026 as a walk across the island. Plain static files, no build step: one stylesheet (`site.css`), a generated one (`places.css`: each place's colour and photographs per light), one script (`site.js`, progressive enhancement only), and the pages. An inline script in every page's head sets `html[data-light]` (Island light) before the stylesheets paint.

## Files
- `index.html` — the walk. Each place is `<section class="place c-…" id="…" data-place="…">` with a `.place-bg` (CSS background from `places.css`), a `.veil` in the place's deep shade only where the words are, and its own composition class (`c-hero`, `c-clearing`, `c-path`, `c-pool`, `c-shore`, `c-cove`, `c-shelter`, `c-outlook`, `c-cottage`).
- `breathe.html`, `ground.html` — free tools; `tools.json` holds the breath timings and the grounding steps (shared with the app's wording).
- `support.html`, `privacy.html`, `terms.html`, `helpers.html`, `premium.html` — reading pages. Privacy, Terms and Support are linked from the app: never rename them.
- `assets/places/` — web-size place crops (Unsplash+, credited in the footer; built by the app repo's `scripts/island/build-site-images.py`). `assets/screens/` — captures of the current app with sample data. `assets/og.jpg` — the link-sharing image.
- `scripts/check-hidden-unicode.sh` — CI guard.

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

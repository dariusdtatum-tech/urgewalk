# Agent notes (website)

Read `DESIGN-RULES.md` first; it is the source of truth for this site and overrides defaults.

## What this is
The public pre-launch site for Urge Walk on GitHub Pages (`https://dariusdtatum-tech.github.io/urgewalk/`), rebuilt from nothing on Nov 8 2026 as a walk across the island. Plain static files, no build step: one stylesheet (`site.css`), one script (`site.js`, progressive enhancement only), and the pages.

## Files
- `index.html` — the walk. Each place is `<section class="place" id="…">` with a `.place-bg` photograph (`<picture>`: wide for landscape screens, tall for phones), a caption, words, and sometimes a phone screen.
- `breathe.html`, `ground.html` — free tools; `tools.json` holds the breath timings and the grounding steps (shared with the app's wording).
- `support.html`, `privacy.html`, `terms.html`, `helpers.html`, `premium.html` — reading pages. Privacy, Terms and Support are linked from the app: never rename them.
- `assets/places/` — web-size place crops (Unsplash+, credited in the footer; built by the app repo's `scripts/island/build-site-images.py`). `assets/screens/` — captures of the current app with sample data. `assets/og.jpg` — the link-sharing image.
- `scripts/check-hidden-unicode.sh` — CI guard.

## How the walk works
`site.js` adds `html.walk` (unless Reduce Motion is on), which fixes every place's photograph behind the page; an IntersectionObserver marks the place crossing the middle of the screen `.here`, and CSS fades its photograph in (520 ms). The trail index (`.trail`, wide screens) gets `aria-current`. Without the script, the page is ordinary stacked sections.

## Rules that bite
- Keep the `noindex` meta until launch. No fake App Store badge.
- Never commit original or full-size photographs; never add images a page doesn't use.
- Changing a tool's wording: change `tools.json` and keep it in step with the app.
- Record every change in the app repo's project record (`urge-walk-app/docs/project-record/`).

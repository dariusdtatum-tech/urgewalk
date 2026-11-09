# Urge Walk website: design rules (read before any change)

Rebuilt from nothing on Nov 8 2026 (founder: "make the website anew instead of just a replacement for its old self"). The earlier rules (A2 icon, cream pages, Plus Jakarta Sans, wave video) are history in git; they no longer apply. Concept and research: `urge-walk-app/docs/design/WEBSITE-ISLAND-WALK-2026-11-08.md`.

## The idea
The site is a walk across the island. Each place of the app is a full-screen photograph with a caption (number · place · light) and a few lines; scrolling dissolves the island from one place to the next, daylight turning to evening at the Shore, ending at night. Every feature is said through its place, never as a feature grid.

## Identity
- **Colour:** night `#0f1d33` (surfaces `#142640`, `#1b3150`), cream ink `#faf7f1`, soft `rgba(250,247,241,.78)`, quiet `.62`, hairline `.22`, sea glass `#a9cbc0` for focus, selection and the breath. Nothing else. `color-scheme: dark`.
- **Type:** Cormorant Garamond 500, upright, for headings and place names; Inter 400/500/600 for text. Self-hosted in `assets/fonts`, OFL licences in `assets/licenses`. Headings end with a full stop when they are sentences.
- **Icon:** the app's W6 mark (`assets/icon-w6.svg`, favicons, Apple touch icon), rebuilt only from `urge-walk-app/scripts/island/build-app-icon.py`.
- **Photographs:** the app's place photographs, web-size crops only (wide 2000 × 1125 and tall 900 × 1600 WebP), built by `urge-walk-app/scripts/island/build-site-images.py` with the app's shared grade. Never original or full-size files (narrowed photo rule, founder, Nov 8). No people; check every new crop at full size. Footer credit: "Stock photography: Unsplash+". Only images a page uses live in the repo.
- **Legibility:** a navy veil over every photograph (functional, as in the app) keeps cream text at 4.5:1 or better. No frosted glass panels, no shadows as decoration, no gradients except veils.
- **App screens:** real captures of the current app with sample data (`assets/screens/`), one per place at most, only where the place needs it, framed by a hairline. Never a grid of mockups.

## Motion
- Interface: 150–300 ms, ease-out, `transform` and `opacity` only.
- One optical exception: the place crossfade, 520 ms, with the arriving photograph settling from 1.04 (the app's `PLACE_FADE_MS` and `PLACE_SETTLE`).
- Scroll is never taken over or pinned. Reduce Motion: nothing moves; each place is a plain section with its own photograph. Without JavaScript the page reads the same way.

## Pages
- `index.html`: the walk (places 1–9, then Night: Coming to iPhone and the founder's note). Trail index at the right on wide screens.
- `breathe.html` (the Tide Pool) and `ground.html` (the Shore): full-screen free tools. Timings and steps from `tools.json`.
- `support.html`, `privacy.html`, `terms.html`, `helpers.html`, `premium.html`: reading pages under a short band of their place (Cottage, Shelter, Outlook, Cove, Trailhead). The app links to Privacy, Terms and Support: keep those addresses.
- Every page: the same header (brand, Breathe, Ground, Support), the same footer (crisis line, links, credits), the pre-launch `noindex`.

## Before launch
- No fake App Store badge: "Coming to iPhone" at most twice on a page. No press logos, ratings, percentages or counters.
- Remove the `noindex` meta from every page at launch.

## Copy
- Plain, short, and kind. Second person, sentence case, no exclamation marks.
- Never shame. Say "Reset is okay, you're still here", not "You failed" or "Streak lost".
- Banned words: delve, vibe, seamless, elevate, unlock, unleash, empower, journey (as filler), supercharge, game-changer, revolutionize, cutting-edge, leverage, robust, harness, tapestry, embark, "level up", "crush it", and "next-level".
- Breathe text never mentions walking. No political or sexual references. 18+ audience: speak to adults.
- Check-in outcomes are Passed / Eased / Stayed. The island never changes with progress.
- Wherever help is mentioned, the crisis line is one line away: 988 in the US, findahelpline.com elsewhere.

## Before you ship
Check every page at 390 px and 1440 px, with and without Reduce Motion; no horizontal scroll; every image loads; tap targets at least 44 px; text contrast at least 4.5:1; `scripts/check-hidden-unicode.sh` passes; no banned words.

# Urge Walk website: design rules (read before any change)

Rebuilt from nothing on Nov 8 2026 (founder: "make the website anew instead of just a replacement for its old self"). The earlier rules (A2 icon, cream pages, Plus Jakarta Sans, wave video) are history in git; they no longer apply. Concept and research: `urge-walk-app/docs/design/WEBSITE-ISLAND-WALK-2026-11-08.md`.

## The aim (founder, Nov 8 2026; these govern every choice below)
> "I want us to reach a level where we do have it as anti slop for sure. I want it to be sophisticated elegance. I want it to be creative as well. It's okay to aim high in a way that is different and not safe. It's okay to be ambitious and go a different path in pursuit of sophisticated elegance."

What that means here:
- **Sophisticated elegance:** restraint with craft. Fewer elements, finer type, generous space, exact alignment, nothing repeated by habit. Every place is composed, not templated.
- **Creative and not safe:** each place gets its own composition; type can be very large, can sit on a horizon, can cascade; a place may carry almost no words. Interactive moments are real (the breath, Island light), never gimmicks.
- **Anti-slop, for sure:** no generic SaaS sections (feature grids, logo walls, stats, testimonials, carousels), no stock people, no rainbow or decorative gradients, no pills around static text, no blobs, no looping attention-seekers. Glass is allowed only when it is crafted: over a photograph, with a visible hairline edge, readable text and an opaque fallback.
- **Rules that came from tools are not rules:** the earlier navy-everywhere look and the ban on glass were defaults (the app's palette, a generic "anti-slop" skill, the old site's rules), not the founder's. Founder direction wins; skills inform craft.

## The idea
The site is a walk across the island, and the island follows the visitor's time of day (Island light, as in the app: daylight 6:00–17:59, evening otherwise; a Daylight · Evening switch overrides it, remembered on this device only). The site is a walk across the island. Each place of the app is a full-screen photograph with a caption (number · place · light) and a few lines; scrolling dissolves the island from one place to the next and ends at night. Every feature is said through its place, never as a feature grid. Each place has its own composition (elegance pass, Nov 8):

| Place | Composition |
|---|---|
| Sheltered Coast | "Urges pass, *like waves.*" set across the sky, very large; lede and "Coming to iPhone." at the foot |
| Clearing | words right, the Ride it out screen in glass left, the tree between; four answers with italic roman numerals |
| Path Ahead | one enormous line, "Walk *it out.*", at the foot of the boardwalk; lede top right |
| Tide Pool | the breath in a glass ring over the water, centred |
| Shore | five to one: the senses typeset as a narrowing cascade |
| Cove | a pause: one italic line, almost nothing else |
| Shelter | a journal page on glass with ruled lines; the journal screen beside it |
| Outlook | "Passed. Eased. Stayed." set large along the horizon |
| Cottage | "Yours, *and only yours.*" with a glass note of privacy lines |
| Night | "Coming *to iPhone.*"; the founder's letter with a drop cap |

## Identity
- **Colour:** the photograph supplies the colour (the app's rule since Nov 8). Each place carries its own tone and deep shade, measured from its photograph by `urge-walk-app/scripts/island/build-site-images.py` (`--tone`, `--deep` per place and light); captions, hairlines, buttons and the trail take the place's tone. No navy anywhere (founder, Nov 8: "The blue is still on the site"; Figma round 1, option B, "B makes the most sense"): each page's night is the deep shade of its own place, set by `data-place` on `<body>` (the walk ends at the Cottage; Support the Cottage, Privacy the Shelter, Terms the Outlook, For helpers the Cove, Premium the Trailhead, Breathe the Tide Pool, Ground the Shore), and it follows Island light. The browser bar follows it too. Cream ink `#faf7f1`.
- **Type:** Cormorant Garamond 300 and 400 (upright and italic) for display, set large with tight leading; italics for the turn in a line; Inter 400/500 for text; captions in small tracked capitals. Self-hosted in `assets/fonts`, OFL licences in `assets/licenses`. Headings end with a full stop when they are sentences.
- **Icon:** the app's W6 mark (`assets/icon-w6.svg`, favicons, Apple touch icon), rebuilt only from `urge-walk-app/scripts/island/build-app-icon.py`.
- **Photographs:** both lights of every place are in the repo and loaded through `places.css` (CSS custom properties per place and light), so a visitor downloads only their light's nine photographs. The app's place photographs, web-size crops only (wide 2000 × 1125 and tall 900 × 1600 WebP), built by `urge-walk-app/scripts/island/build-site-images.py` with the app's shared grade. Never original or full-size files (narrowed photo rule, founder, Nov 8). No people; check every new crop at full size. Footer credit: "Stock photography: Unsplash+". Only images a page uses live in the repo.
- **Legibility:** a local veil in the place's own deep shade sits only behind the words, so the photograph keeps its light; cream text at 4.5:1 or better on the veiled area. Glass where it earns its place (app screens, the breath, the Cottage note, the header after scrolling): blur over the photograph, a tint of the place's deep shade, a hairline edge, an opaque fallback without `backdrop-filter`.
- **App screens:** real captures of the current app with sample data (`assets/screens/`), one per place at most, framed by a hairline. Never a grid of mockups. App first (Nov 10, founder: "i want people to be focused on the app"): the first screen shows the app itself, and every place that has a screen shows it, on phones too; a screen may be a short recording of the real app.

## Motion
- Interface: 150–300 ms, ease-out, `transform` and `opacity` only.
- One optical exception: the place crossfade, 520 ms, with the arriving photograph settling from 1.035 (the app's `PLACE_FADE_MS`, close to `PLACE_SETTLE`).
- Each place's words rise once when it arrives (opacity and 10 px, 300 ms, staggered 60 ms); never again, never on loop.
- Scroll is never taken over or pinned. Reduce Motion: nothing moves; each place is a plain section with its own photograph. Without JavaScript the page reads the same way.

### Motion direction (founder, Nov 9 2026)
"This is the path that we need to take moving forward": real moving footage (sea, grass, branches in the wind), 4K where the screen can use it, and a still for devices that need it. It supersedes "no looping" for footage only; the interface rules above still hold.
- Footage from Pixabay, real camera footage only (anything tagged "ai generated" is excluded); no people, animals, houses, boats or brands.
- Motion means something: in Ride one out (`ride.html`) the sea's speed follows the urge, then slows and stops when it passes.
- Sources per device: 2160p on large sharp screens, 1440p otherwise, a tall 1080 × 1920 cut on phones; a still poster under Reduce Motion, Save-Data or 2G, and a "Motion on / off" switch for everyone.
- Seamless loops, no audio, a crossfade at the seam; the poster frame is always present.
- Living places (Nov 10, founder: the site should open with an arrival and "move throughout", like the app): the walk opens on the arrival (boat nearing the island, played once, resting on its last frame), and every place with an app loop moves; only the place in view plays, footage loads only near the visitor, the poster is the loop's first frame. The island-map card is gone (founder, Nov 10).

## Pages
- `index.html`: the walk (places 1–9, then Night: Coming to iPhone and the founder's letter). Trail index at the right on wide screens.
- `places.css`: generated from `tones.json` (place colours) by the site generator; never edit by hand.
- `ride.html` (Ride one out, the Shore, Nov 9): ninety seconds traced as a wave over moving 4K footage (`assets/motion/`); linked from the Coast and every footer.
- `breathe.html` (the Tide Pool) and `ground.html` (the Shore): full-screen free tools. Timings and steps from `tools.json`.
- `support.html`, `privacy.html`, `terms.html`, `helpers.html`, `premium.html`: reading pages under a short band of their place (Cottage, Shelter, Outlook, Cove, Trailhead). The app links to Privacy, Terms and Support: keep those addresses.
- Every page: the same header (brand, Island light switch, Breathe, Ground, Support; glass in the current place's deep shade once scrolled), the same footer (crisis line, links, credits), the pre-launch `noindex`.

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

# Urge Walk design rules (read before any UI or copy change)

Urge Walk is a calm recovery and walking app from Darius Tatum. It should feel warm, steady, quietly confident, and handmade but professional, like a well-kept coastal house. It is never loud, corporate, techy, or "AI-made". If a change makes it look like a generic template, undo it.

## Island restyle (Nov 8 2026, founder: "Build it"; supersedes the lines below where they differ)

The site wears the app's island look; the older rules below stay as history.
- **Palette:** night only. Background `#0f1d33`, surfaces `#182b47`/`#14243d`, cream ink `#faf7f1`/`#f3ede2`, muted `#c3cad6`, sea glass `#a9cbc0` for focus and selection. `color-scheme: dark` on every page. All text pairs at least 4.5:1 (cream on night is 15:1).
- **Type:** upright Cormorant Garamond 500 for display (no italics), Inter 400/500/600 for text, both self-hosted in `assets/fonts` (OFL, licences in `assets/licenses`). Plus Jakarta Sans is retired.
- **Photographs:** the landing page is photo-led: one place full-bleed in the hero (the Sheltered Coast) and two place bands (the Path Ahead, the Cove), each with a navy veil for legibility. No people. Phone frames show real captures of the current app, daylight, sample data, with a caption saying so.
- **Glass:** allowed only over a photograph, as in the app: navy 45%, 22 px blur, cream hairline `rgba(250,247,241,.18)`, radius 22. Never on a plain background.
- **Buttons:** cream pill on night (`border-radius: 999px`), navy text.
- **Header:** transparent over the hero on the landing page; elsewhere navy 78% with a 16 px blur and a hairline.
- **Copy:** unchanged rules (plain, kind, second person, no banned words). Outcomes are Passed / Eased / Stayed. The island never changes with progress.
- **Code:** the island layer is the last block of `style.css`; landing-page classes start with `isl-`. Older layers above it are kept as history.

## Brand (locked)
- **Colors:** cream `#faf7f1`, warm sand `#f1ebe0`, navy `#24395c`. Accents: deep sea `#3f7a6b` (text only on cream or white), sea glass `#a9cbc0` (fills only, never text). Night mode: `#0f1d33` background, `#182b47` surfaces, cream text.
- **Type:** Cormorant Garamond italic for display moments (numbers, quotes, titles). Plus Jakarta Sans for everything else. Use two weights at most per screen.
- **Icon:** the W6 mark (Nov 8 2026): a tilted horizon, sea below, the light low on the right with its road across the water. Light = day, dark = night; both share the same geometry. Source of truth: `urge-walk-app/scripts/island/build-app-icon.py` and `assets/icon-src/`. Site files: `assets/icon-w6.svg`, `assets/icon-w6-dark.svg`, `favicon-*-w6.png`, `apple-touch-icon-w6.png`. Don't redraw or recolor; rebuild from the app's script. (Replaced the A2 mark.)
- **Space:** generous whitespace. Screen padding 16, card padding 14, tap targets at least 44pt. Cards are flat sand or cream with a hairline border or none at all.
- **Motion:** slow and soft (200–350 ms ease-out, gentle springs). No bounce, shake, confetti, or looping attention grabbers.

## Banned
- Box shadows, glows, or blur used as decoration. A subtle hairline or a color step is enough.
- Gradients in blue, purple, pink, or neon, and gradient text. The only gradient allowed is the soft cream-to-sand ground already in the icon.
- Emoji anywhere in the UI or in product copy.
- "LIVE", "NEW", "HOT", or pulsing badges, notification-style red dots, and count bubbles used to create urgency.
- Red, or any alarm color, for a slip, a reset, or an error. Resets use neutral navy or sand, with calm wording.
- Glassmorphism on the website (the app itself uses frosted glass over its place photographs since Nov 8 2026; the site keeps flat surfaces), neumorphism, 3D blobs, stock illustrations of people, and generic line-art "hero" scenes.
- Dense dashboards, stacked stat tiles, and charts on Home beyond the agreed preview.
- Ads, streak-restore or streak-freeze sales, guilt prompts, and countdown pressure.
- Centered everything. Left-align body text and keep one clear focal point per screen.

## Copy
- Plain, short, and kind. Use second person, sentence case, and no exclamation marks.
- Never shame. Say "Reset is okay, you're still here", not "You failed" or "Streak lost".
- Banned words: delve, vibe, seamless, elevate, unlock, unleash, empower, journey (as filler), supercharge, game-changer, revolutionize, cutting-edge, leverage, robust, harness, tapestry, embark, "level up", "crush it", and "next-level".
- Breathe text never mentions walking. No political or sexual references in the product. Religious content appears only in an optional faith feature the user chooses to turn on.
- 18+ audience: speak to adults, without cute mascots or baby talk.

## Before you ship
Check that the change works in both light and dark mode, that contrast is at least 4.5:1 for text (3:1 for large text and UI), that it uses only the colors above, and that it has no emoji, decorative shadows, or banned words. Test it on a stressed reader: is the next step obvious in one glance?

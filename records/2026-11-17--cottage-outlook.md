# 2026-11-17: Website: the Outlook by day moves, and the Cottage gets its phone (proposed, not merged)

## Request

The founder said here (verbatim): "looks great. day history doesnt move, fix that. and the two cottages, should get an app version of both and do the same with them."

- "day history": the Outlook (History in the app) by day.
- "the two cottages": the Cottage by day and by evening.

## What changed (branch `site/outlook-cottage-2026-11-17`)

### The Outlook by day moves

- Why it didn't move: the tower footage is an upright phone clip, so there was no landscape loop. On wide screens the opened Outlook by day showed a still (`site.js` skipped it on purpose).
- New `assets/motion/outlook-wide.mp4` (1280 × 720, 0.66 MB, about 4.7 s):
  - a full-width 16:9 band of the app's own loop (`assets/motion/outlook.mp4` at `39c9261`, 1216 × 2160)
  - already steadied on the tower and closed with a crossfade
  - band at y 864, the one that best matches the old wide still (correlation 0.92)
  - scaled up 5%
- `outlook-wide.webp` is now that loop's first frame. Checked: no people, only a distant boat.
- `site.js` no longer skips it. `scripts/build-motion.py` records the band (`BANDS`).
- Reduce Motion and Motion off: a still with "Play the loop", like the other places.

### The Cottage: the app's version, by day and by evening

- In the app, the Cottage is the You screen: "Your quiet courtyard", with the settings on a tray.
- It was recorded from the app at `376b215`, run from a scratch copy, in both lights. The recording uses the same invented sample data as the other phones (a sample habit, "Drinking · 58 days", shows on the raised tray).
- Each recording starts on the courtyard, raises the settings, rests, and lowers again: `assets/screens/you.mp4` (0.20 MB) and `you-evening.mp4` (0.10 MB). The stills are their first frames, 390 × 844.
- The Cottage now works like the other places:
  - its words and the "On your phone" note on its colour, with the phone in a card beside them, on the right
  - tapping it opens the Cottage photograph full screen, the red cabin by day and the house at dusk by evening
  - "Next" now runs on to the Cottage
- The app keeps the Cottage still, so the opened Cottage is a photograph with no loop and no "Play the loop".
- Colours: `scripts/reveal-colours.py` now also reads the Cottage photographs: page text 15.6:1 and 16.0:1, "Step in" 4.9:1 and 10.4:1.
- The heading and the note are a little smaller, so the pair fits beside the phone.
- `sw.js`: cache `uw-2026-11-17-r6`.

## Verification (local, headless Chrome)

- **Outlook by day:** at 1440 px it opens to `outlook-wide.mp4`, playing. Before, the live site had no video (checked on urgewalk.app).
- **Cottage:**
  - Opens full screen at 1440 and 390 px, by day and by evening. Escape closes it, and focus returns.
  - The phone plays `you.mp4` by day and `you-evening.mp4` by evening.
- **Next:** Coast > Clearing > Path > Tide Pool > Shore > Outlook > Cottage, hidden at the end.
- **Reduce Motion, Motion off and no JavaScript:** no recording starts, and the Cottage shows `you.webp`.
- **Light switch:** 68 pictures, 0 failing.
- **CSP:** no errors at 375 or 1440 px (only the expected nested 404).
- **Hidden-Unicode** check passes.
- **Not checked:** a real iPhone, Safari, VoiceOver.

## Preview

`previews/cottage-outlook-2026-11-17.jpg`: live today, this PR, and the Cottage opened in both lights.

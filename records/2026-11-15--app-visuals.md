# 2026-11-15: Website: every app picture brought up to date, and moving

## Request

Founder, relayed by the main session (verbatim): "Looks like we can get the website updated to where we are currently and also have them make sure every visual of the app that can move, moves."

After the audit and plan (six phones, all out of date, all able to move), the founder answered the six questions (verbatim): "Yes, your picks". That means:
1. Record now. The site PR waits until the app's glass work is pushed and merged.
2. Run a private copy of the app from a scratch folder at app commit `4b35df9` (branch `design/drag-trays-2026-11-11`), using the app's installed packages and installing nothing new.
3. Keep using the ffmpeg bundled in the Python package imageio-ffmpeg.
4. The Walk phone, the Path section and the Walk page show the evening Walk in both lights until he picks a new daylight picture.
5. Add a seventh phone: Breathe at the Tide Pool.
6. Source C, mixed: the web build for every screen. iPhone recording cuts only where clearly better, and only with his OK per clip.

## Baseline

- Site `main` at `20e952c`. App read at `4b35df9`; the app checkout was not changed.
- The site's phones were captured on Nov 10, which is 81 app commits earlier, before the glass work. Only Home and Walk moved.

## What changed (branch `site/app-visuals-2026-11-15`)

| Phone | Before | After |
|---|---|---|
| Hero: arrival | still | moves (the boat clip under "You're here."), one version |
| 01 Coast: Home | Nov 10 recording | new recording, day and evening |
| 02 Clearing: Ride it out | still | moves, day and evening |
| 03 Path: Walk | day and evening recordings | the evening recording in both lights |
| 04 Tide Pool: Breathe | (none) | new phone, moves, day and evening |
| 05 Shore: Ground | still | moves, day and evening |
| 06 Outlook: History | still | moves: the tray lowers to show the Outlook, then rises, day and evening |

- Path section background (homepage and walk.html): the evening footage, stills and tones in both lights. The section label reads "· evening".
- `og.jpg` was rebuilt with the new arrival still and the Sea glass mark (the site's current icon).
- Removed `assets/screens/walk.mp4` and `walk.webp`, which nothing uses any more.
- `sw.js` cache: `uw-2026-11-15-r1`.
- Capture scripts were saved to `scripts/capture-app/`. `_config.yml` now also keeps `records/` and `scripts/` off the published site.

## How the pictures were made

- **The app:** `git archive 4b35df9` was unpacked into a scratch folder. Its `node_modules` was a junction to the app checkout's (same commit). Expo web ran on port 8120.
- **Capture:** puppeteer-core with headless Chrome, at 390 × 844 and DPR 1.5. Local storage was seeded with invented data:
  - one habit, "Drinking"
  - 14 sample walks
  - three journal pages
  - milestones 7 and 30
  - the scene sound switched off, so the "Sound paused" pill doesn't show on web

  The capture date was 2026-11-15, and the Island light was set to day or evening. No founder data was used.
- **Encoding** (`scripts/capture-app/encode.py`): H.264 at 390 × 844, CRF 30 (Breathe 33), 25 fps, faststart.
  - Home, Ride, Ground and the arrival dissolve their last 1.5 s into their first.
  - Walk and Breathe cut. Breathe is 13 s, one full breath.
  - History plays its clip backwards and then forwards, so it starts and ends with the tray raised.
  - Each still is the loop's first frame, as a webp at 390 × 844 (Chrome's screencast frames are CSS pixels, so DPR 1.5 didn't apply). The Nov 10 stills were 585 × 1266. Under Reduce Motion, Motion off or no-JS the stills are a little softer on high-density screens; a 585 × 1266 re-take needs the app's web build running again.
- **Sizes:** loops are 0.1 to 1.1 MB each. Each loads only while its phone is on screen.
- No iPhone recordings were used. The private Sources folder wasn't opened: the main session hasn't sent a list of usable clips.

## Verification

- `shots.cjs` puppeteer pass at 390 and 1440 px, day and evening:
  - all seven phones play their own recording, the right one for each light
  - the Path plays `path-evening-*` by day
  - no horizontal overflow
- Reduce Motion, Motion off and JavaScript off, on index.html and walk.html:
  - no recording starts and the stills show
  - the Path background is the evening still
- Before and after sheets: `previews/app-visuals-2026-11-15-{390,1440}-{day,evening}.jpg`.
- The hidden-Unicode check passes. Run with the real Python, because `python3` on this PC is the Store alias.
- index.html and walk.html parse.
- Not checked: a real iPhone, Safari.

## Open

- **Merge order:** merge only after the app's glass work (`4b35df9`) is pushed and merged. If the app changes again before then, re-run `scripts/capture-app/`.
- **Daylight Walk:** waits for the founder's new daylight picture. Swap `walk-evening` back to a day/evening pair, and drop the Path override in `site.js` (`loopFor`) and `site.css`.
- **Daylight History** (founder, 16 Nov, relayed): History by day must show the lighthouse, as it does by evening. A daylight lighthouse picture still has to be found, so the daylight History phone in this PR is not final. Re-capture it once the app has the new picture.
- **Home** stays moving. The founder confirmed (verbatim, relayed): "home's water visibly moves on my phone".
- **iPhone cuts:** none used. The web build was clearer in every comparison; see the private shared notes for 16 Nov.
- **iPhone cuts (rule):** any iPhone recording cut needs the founder's OK per clip.

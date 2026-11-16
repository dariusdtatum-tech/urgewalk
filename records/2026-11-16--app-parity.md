# 2026-11-16: Website: every picture checked against the app, the Walk fixed

## Request

Founder (verbatim): "Not every visual is the same. Walk isn't the same. The app is fine. Doesn't show the day. And doesn't cycle when you click daylight/evening. You audited the site but didn't catch this? /be-ambitious audit the site, be thorough."

## Why the earlier audit missed it

The audit on Nov 16 checked wording, links and files. It did not compare pictures with the app, and it treated "the Walk in evening in both lights" as settled. That was a Nov 15 choice, made while the daylight Walk picture was thought undecided. In fact the app has had both Walk pictures since Nov 13 (`ca5dd8e`, `587f5c5`).

## Measured

Two checks, both saved in the repo so they can be re-run:

- **`scripts/check-parity.py`:** compares each place picture with the app's picture for that place and light, read from the app's Git (never uncommitted trials).
  - Phone and tall versions must be copies of the app's loop (≥ 0.90).
  - Wide versions are searched across every frame of the app's loop.
  - Photographs are matched by keypoints (ORB + RANSAC). The same photo scored 0.92 to 0.98; different photos scored 0.08 to 0.28.
- **`scripts/check-light-switch.cjs`:** on all ten pages, at 390 and 1440 px, it notes every background and phone, clicks Evening, then Daylight, and checks that each one changed and came back.
  - Against the live site it failed 10 of 67, all of them the Walk: the Path background, its loop, and the Walk phone, on both the homepage and walk.html. That is the founder's report.

Found against the app at `66c2009`:

| Picture | Site before | App | Now |
|---|---|---|---|
| Walk (Path), day | chalk cliffs (Pixabay 44971); evening footage shown instead | dune grass and flowers (239428) | fixed |
| Walk (Path), evening | golden dune grass (89766) | sunset over a wide beach (134196) | fixed |
| Walk phone | evening in both lights | day and evening | fixed |
| All phones | glass from `4b35df9` | brighter glass (`c4da3c2`) | re-recorded at `66c2009` |
| Shelter (Privacy and reading pages), both lights | an older square window and doorway | the arched window (Nov 9), the dusk window (Nov 10) | fixed; tones updated |
| History (Outlook), day | the rock headland (23748) | the stone tower on the beach (`23d1562`, Pexels 32448186), tray "Lower to the tower" (`39c9261`) | fixed (see below) |

Inlet and Shore wide scored 0.78 and 0.67 ("look"): checked by eye, same footage, with the water moving. The keypoint fallback added later (below) confirms them: 0.93 and 0.94.

## Changes (branch `site/app-parity-2026-11-16`)

- **Path footage:** `assets/motion/path*` rebuilt by `scripts/build-motion.py` from the app's own loops (tall) and the same Pixabay clips at 1920 × 1080 (wide). Start times were found by matching the app's loop inside each clip: 6.5 s and 5.5 s. The downloads stayed in scratch.
- **Phones:** all seven phones re-recorded from the app at `66c2009` (scripts in `scripts/capture-app/`, encode settings saved).
- **Evening-only Walk removed:** walk day and evening on the homepage, the Path's evening override in `site.js` and `site.css` removed, and the "· evening" label back to daylight / evening on index.html and walk.html.
- **Shelter:** `assets/places/shelter-*` re-cropped with the app's own `scripts/island/build-site-images.py` functions from the originals in the private Sources folder (Nov 8). Only the web crops are published, and they were checked by eye: no people. `places.css` tones updated.
- **Other:** AGENTS.md says when to run the two checks. `sw.js` cache is `uw-2026-11-16-r2`.

## History by day (added 16 Nov)

Founder (verbatim): "It's changed now. Not tonight." The app had committed History by day: `23d1562` (the stone tower on the beach, Pexels 32448186, marked placeholder in the app) and `39c9261` (the tray says "Lower to the tower").

- **Tall:** `outlook-tall.mp4/.webp` copied from the app's `assets/motion/outlook.mp4` at `39c9261` by `build-motion.py` (720 × 1280).
- **Wide:** the source is an upright 4K phone clip (2160 × 3840) in the private Sources folder, so no landscape loop exists. `outlook-wide.webp` is a still: a 16:9 band (y 1500 to 2715) of the frame at 6.0 s, 1280 × 720, with the tower, its base, the sea and the beach. Checked at full size: no people, only a distant boat. Only this web-size still is published.
- **History phone:** re-recorded in both lights from the app at `39c9261` (scratch copy, `history.cjs`, `pingpong` in `encode.py`). By day it lowers to the tower, by evening to the lighthouse.
- **Parity judge:** a band of an upright source can't contain the app's frame, so wide pictures that score under 0.85 now also get the keypoint test (0.60 or more passes, shown as `kp`). Seven frames of the tower band scored 0.57 to 0.69, and the 6.0 s frame was picked at 0.69 (0.76 after the webp save). The old rock headland and two wrong places scored 0.11 to 0.12.
- **App note (for the main session):** in the evening the tray also says "Lower to the tower" over the lighthouse. The site shows what the app shows.

## Verification

- **Parity** (app `39c9261`): 34 pictures, 0 failed, 0 to look at. (Before the History update: 2 failed, both History by day.)
- **Switch:** 67 pictures on the branch, 0 failing. The same test on the live site fails 10 (the Walk), so the test catches the problem.
- **Switch, after the History update:** 67 pictures, 0 failing.
- **No motion:** Reduce Motion, Motion off and no-JS: no recording starts, and the stills show the daylight Walk by day.
- **Other checks:** the hidden-Unicode check passes, and index.html and walk.html parse.
- **Before and after:** `previews/app-parity-2026-11-16-{390,1440}-{day,evening}.jpg`; History by day: `previews/history-day-2026-11-16-{390,1440}.jpg` (live on the left, the branch on the right).
- Not checked on a real iPhone.

## Open

- **History by day:** the app marks the tower a placeholder. If it changes, rebuild `outlook-tall`, cut a new wide still, re-record History and re-run both checks.
- **Path tones:** the Path's colour tones (`places.css`) still come from the Nov 8 photographs. The new footage reads fine against them.

## Merged and live (16 Nov)

- **Request:** founder, here (verbatim): "Merge".
- **Merge:** PR #35 merged as `95be306` (head `b7584dd`). All four checks passed.
- **Pages:** the build of `95be306` finished as "built". The live cache is `uw-2026-11-16-r2`.
- **Checked on urgewalk.app:**
  - The light-switch test: 67 pictures, 0 failing. Before the merge, the same test on the live site failed 10.
  - `outlook-wide.webp`, `outlook-tall.mp4` and `history.mp4` match the repo byte for byte.
  - `records/` and `scripts/` return 404 (not published).
- **Seen once:** a missing page answered 503 instead of 404 on one of four tries, right after the deploy. This is GitHub Pages or Cloudflare, not the site's files. Re-check it on the next routine check.

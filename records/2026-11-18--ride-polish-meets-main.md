# 2026-11-18: Ride one out polish (PR 31) brought up to today's main (proposed, not merged)

## Request

The founder, first day on the Mac (verbatim): "move on to urgewalk #31 and #29". After the review found that PR 31 couldn't merge as it was, to "Update #31 for today's main (conflicts, script hash, hours)?": "Yes, update #31".

## What was wrong

PR 31 branched from main on 11 Nov (`9bf0562`). Main has had 35 commits since, and three of them changed what PR 31 relies on:

1. **Conflicts** in `ride.html` (2) and `sw.js` (1).
2. **The Ride script would have stopped running.** Main added a Content-Security-Policy on 16 Nov that allows an inline script only if its sha256 is listed. PR 31 rewrites Ride's body script (the evening sea), so its hash wasn't listed. Merged as it was, the timer, the wave and the sea switch would all have stopped, with no visible error.
3. **The hours moved.** Main now uses Island light 5:00–16:59 for day, as the app does. PR 31 and its tests still used 6:00–17:59.

## What changed (merge commit on `ride/polish-2026-11-14`)

- Merged `origin/main` (`61ab6b1`) into the branch, with no rebase and no force push.
- `sw.js`: the cache version is now `uw-2026-11-18-r1`, newer than both sides (`uw-2026-11-14-r1` and main's `uw-2026-11-17-r6`). The precache list merged cleanly and keeps PR 31's `shore-evening-wide.webp`.
- `ride.html`:
  - The style block keeps PR 31's token colours, `.still` and `.nojs`. Main's only change there was removing `opacity:.85` from `.help`, and PR 31 already has no opacity on it.
  - The header line is main's: it adds the floating Ride it out button (Nov 16 audit). Otherwise both sides were identical.
  - The caption keeps PR 31's `js-only` spans and main's `aria-live="off"` on the clock.
  - In the CSP, the body script's hash is now `sha256-xhYTF3IyKTOQrKnW2KDOvhsInzwoY+7W2m2CbLl8NcM=` (taken after CRLF became LF). The head script (main's, 5:00/17:00) keeps its listed hash. The method was checked first on main's `ride.html`, `index.html` and `breathe.html`: 0 mismatches.
- `tests/ride-light.test.mjs`: the boundaries moved to main's hours.
  - 16:59:59 is day, 17:00:00 is evening, 04:59:59 is evening, 05:00:00 is day.
  - The spring-forward case is now at 05:00 EDT.
  - The wide evening and Motion off cases are now at 17:00.
  - The other cases are unchanged.

## Checks (Mac, 18 Nov; Node 26.13.1, Chrome)

- `node tests/ride-light.test.mjs`: 20 passed, 0 failed.
  - Run from a scratch copy that only changed `chromium.launch()` to use the installed Chrome (`channel: 'chrome'`), with Playwright borrowed from PR 29's install.
  - Control: with the old hash put back, the run timed out clicking Start because the script never ran. So the tests do catch the CSP break.
- PR 29's site check (`tools/check.mjs`, run from a scratch copy against this merge): RESULT PASS.
  - axe: 0 violations on all 11 pages at 390 and 1440.
  - 132 links and assets returned 200, with no console errors and no overflow.
  - Lighthouse mobile home: accessibility 100, performance 90.
  - The Google-mail guard is clean.
- `scripts/check-light-switch.cjs`: 68 pictures checked, 0 failed to follow the switch. It was run from a scratch copy with the Mac Chrome path, because the script hard-codes the Windows path.
- Browser pane at 390, served locally:
  - Start runs: the clock counts down and "It's rising" shows, with the day sea.
  - Evening switches the idle sea to `shore-evening-tall.mp4` and its poster.
  - The pane logs "An unknown error occurred when fetching the script" from the service worker. Main shows the same message, so it isn't from this change.

Not done: the no-JS view and the contrast numbers were not re-measured. The PR's 14 Nov results cover them, and the merge didn't touch that CSS or markup apart from the caption. No real iPhone was used.

## Still open

- Founder: review and merge PR 31.
- `scripts/check-light-switch.cjs` hard-codes Windows' Chrome path. On the Mac it needs `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Not changed here, since it's out of scope.

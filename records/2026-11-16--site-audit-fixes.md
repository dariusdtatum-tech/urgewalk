# 2026-11-16: Website: audit against the app, and three fixes

## Request

Founder (verbatim): "merge #33 and audit the site using all of the information you have today, does everything line up?" After the audit (verbatim): "Yes, fix them".

## Audit (live site, after PR #32 and #33)

- All ten pages load. 127 referenced files were checked and none is missing. `records/`, `scripts/`, `previews/` and AGENTS.md are not published.
- `tools.json` is identical to the app's `src/content/tools.json`.
- Checked against the app's code (checkout at `c4da3c2`, read only):
  - breathing 4-3-6
  - walk lengths
  - hold to start a walk
  - three trusted contacts
  - the paths in You
  - the free list on Premium
  - the permissions in Privacy
- No prices. The Sea glass icon is used everywhere. No `-n10` reference is left on a page.

## Mismatches found and fixed (branch `site/audit-fixes-2026-11-16`)

1. **Island light hours.** The site used daylight 6:00 to 17:59. The app (`src/lib/islandLight.js`) uses 5:00 to 16:59. The head script on all ten pages is now `h>=5&&h<17`. AGENTS.md, DESIGN-RULES.md and the comment in `site.js` say the same.
2. **Privacy, Face ID.** The line now names the Journal lock (app commit `085739a`, Nov 15) beside App lock and the Your reasons lock. Last updated: November 16, 2026.
3. **Support.** "in the bar at the top of every place" became "at the top of every place" (Ride it out is a glass pill now).

`sw.js` cache: `uw-2026-11-16-r1`.

## Left as it is

- Support still mentions swiping in from Home's left edge to reach Trackers. That's true in the app. The founder was asked whether to remove it and hasn't said.
- Daylight Walk and daylight History pictures: placeholders.
- No 404 page, robots.txt or sitemap.
- For the app session:
  - the app's Privacy, Terms and Support links use the old `github.io` address
  - the app's free list says "Web tools: Breathe and Ground" without Walk

## Verification

- The head script was run with the hour set to 4, 5, 16 and 17: evening, day, day, evening.
- The hidden-Unicode check passes.
- Not checked in a browser beyond that; the changes are text and one comparison.

## Merged and live (16 Nov)

- Founder, here (verbatim): "Merge". PR #34 merged as `8005e84`. The Walk and History placeholders above were then fixed in PR #35 (see `2026-11-16--app-parity.md`).

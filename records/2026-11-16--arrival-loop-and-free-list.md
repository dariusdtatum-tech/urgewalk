# 2026-11-16: Website: the arrival loops nonstop, and Premium's free list matches the app

## Request

After the full audit, the founder answered the open questions here (verbatim):

"1. Site's list change 2. Yes its ok 3. Let it stay, we will get there. 4. ok ill take care of that tomorrow 5. ok that makes sense 6. for the first page, the onboarding visual, can you make it into a nonstop loop?"

What each answer means:

1. Premium's free list on the site changes to match the app's list (`src/content/free-features.json`).
2. "Why I made this" keeps "my own toughest stretches".
3. Support keeps the mention of the left-edge swipe.
4. The founder sets the Cloudflare and GitHub settings himself tomorrow (security headers, CAA, DMARC, default workflow permissions).
5. Contrast over bright photos becomes a later design PR, with shots.
6. The homepage arrival (the boat nearing the island) loops nonstop instead of playing once.

## What changed (branch `site/arrival-loop-2026-11-16`)

### The arrival, nonstop

- **Before:** the clip played once (11 s), then rested on its last frame as a picture.
- **Why a plain loop fails:** the boat moves toward the island, so the island grows. A crossfade at the seam showed two islands and a doubled horizon.
- **How it's made now:** `scripts/steady-loop.py` holds the island still.
  - Each frame is lined up with the last frame, using the island and horizon (the top 55%).
  - The movement is smoothed, and each frame is zoomed 4% so no edge shows.
  - The last 2 s dissolve into the first.
  - The sea and the wake keep moving.
- **Sizes and lengths:**
  - wide: Pixabay 59046 (4K), 1280 × 720, 9.2 s, 1.8 MB
  - tall: the app's `arrival.mp4` with its 0.6 s fade-in cut, 720 × 1280, 8.6 s, 1.5 MB
  - Both are smaller than before.
- **Posters:** each poster is now its loop's first frame. The `-end` stills are unchanged and still show under Reduce Motion, Motion off and no-JS.
- **Behaviour in `site.js`:**
  - The words come in after one pass (about 9 s); the 14 s fallback stays.
  - The loop pauses when the arrival is off screen or the tab is hidden, and plays again on return.
  - If autoplay is refused, the page rests on the still. A pause during start-up no longer counts as a refusal.
  - The end still is no longer downloaded up front, since a loop never ends.
- **Checked for people:** every frame sheet of both loops, at full size. Nothing but sea, wake and island.

### Premium's free list

- It is now the app's 16 items, in the app's order and words, read from app `376b215` through `git show`. The app's opening line is used too: "Everything in Urge Walk is free to use, with no ads and no account."
- **Removed from the site** (not in the app's list):
  - "Every place on the island, by day and by evening, and the optional sounds of each place."
  - The Walk web tool. The app lists "Web tools: Breathe and Ground"; `walk.html` still exists.
- **Kept as a line under the list:** "We'll never sell a way to restore your count. Your count is yours." It is a promise, not a feature.

### Other

- `sw.js` cache: `uw-2026-11-16-r5`.

## Verification (served locally)

- **The loop** (`scratchpad/cap/loopcheck.cjs`, 390 and 1440 px):
  - Each clip plays past its end and keeps going (11 s in it was at 2.5 s and 1.9 s, still playing).
  - The words arrive.
  - The clip pauses when scrolled away and plays again on return.
  - No script errors.
- **Reduce Motion, Motion off and no-JS:** nothing plays, and the arrival shows its end still with the words.
- **The phones** (modes check, index and walk): the stills show and nothing plays.
- **Light switch:** 67 pictures checked, 0 did not follow the switch.
- **Every page at 375 and 1440 px:** no CSP errors and no broken images. The only failure is the expected 404 status on the nested 404 test address.
- **Hidden-Unicode check:** passes. `site.js` parses.
- **Not checked:** a real iPhone, Safari (loop and autoplay).

## Previews

- `previews/arrival-loop-2026-11-16-frames.jpg`: top row, the old clip at 0, 3, 6, 9 and 11 s (the boat closing in); bottom row, the new loop at 0, 3, 6, 8.5 and 9.1 s (the island held).
- `previews/arrival-loop-2026-11-16-{1440,390}.jpg`: the homepage with the loop playing.

## For the app (not changed here)

- The app's free list leaves out the Walk web tool, which the site has (`walk.html`).

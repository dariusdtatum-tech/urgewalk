# 2026-11-16: Website: the new daylight Walk, and a fine-tooth audit of every page

## Request

Relayed by the main session. The founder's words (verbatim): "Yeah and have it make sure its properly up to date. With everything privacy, premium, support, etc. Make sure to have it run any and all skills needed so that it can audit the website with a fine tooth"

The new daylight Walk is in the app at `376b215` (branch `design/drag-trays-2026-11-11`, local, not pushed). The founder chose it (verbatim, from the app's record): "We'll keep beach."

## The daylight Walk (Path Ahead)

- **Source:** Pexels 27303501 (Nils Vega), a 4K landscape clip (3840 × 2160) in the private Sources folder. The app uses 20 to 32 s of it, as an upright slice starting at x 2560.
- **Wide loop** (`path-wide.mp4/.webp`):
  - Same seconds as the app, 10.5 s with a 1.5 s crossfade.
  - A towel and a beige shape lie at the waterline between x 2120 and 2560. The app's slice leaves them out, and the wide window does too: x 2600 to 3840, y 680 to 1378 (1240 × 698, scaled up 3%).
  - Checked at full detail at 20, 26 and 32 s, and as a sheet of the finished loop: no people, no towel.
  - Only the web-size loop is published.
- **Tall loop:** the app's own `path.mp4` at `376b215`, scaled to 720 × 1280.
- **Walk phone:** re-recorded in daylight from the app at `376b215` (scratch copy, invented sample data, `shoot.cjs walk --video`, `cut` in `encode.py`). The evening Walk is unchanged.
- **Screen-reader text:** "The Path Ahead: dune grass and a wide beach by the sea" (since PR #37) fits both lights and doesn't mention flowers, so it stays.
- **`build-motion.py`:** the day Path entry now names the Pexels file and its crop window. `wide_loop` takes an optional window.
- **`check-parity.py`:** this wide window is a band inside the app's own frame, so the judge gains a third test. It searches the middle of the wide still at 14 scales inside every app frame, and 0.85 or more passes as `in`. The Walk scored 0.91; wrong places scored 0.33 to 0.71.

## How the audit was run

- Four read-only agents ran in parallel. I then checked each finding before acting on it.
  1. **SEO and links:** searchfit-seo seo-audit, technical-seo, on-page-seo, broken-links and schema-markup. Plus every link, the manifest, the service worker, and the meta and social tags.
  2. **Accessibility and UX:** design:accessibility-review, vectorlab-ux-skills ux-audit, ux-ui-audit and ui-consistency verifying. Measured on the live site at 320, 375, 640 and 1440 px, in daylight and evening, with Reduce Motion and with JavaScript off, plus Tab walks and contrast measured from pixels.
  3. **Content against the app:** every page claim by claim against the app at `376b215`, read through Git only, and the iOS port docs for Apple Health. Then design:ux-copy and urge-walk-ui-polish.
  4. **Security:** the security-review checklist applied to the whole repo, plus headers, DNS, the workflow, and a scan of Git history for secrets.
- The app checkout was only read, never changed.

## Fixed in this PR

**Content (checked against the app's code):**
- **Privacy:** the backup file holds more than the page said. It now lists check-ins, setup answers, milestones, trusted contacts, a saved support number and Money kept (app `src/lib/backup.js`).
- **Privacy:** "What the app stores" now lists setup answers and your anchor, and Money kept.
- **Privacy, Apple Health:** this replaces the claim that the Watch app will ask to save walks. The app doesn't use Apple Health today. A later version may let you save walks and breathing sessions, off unless you turn it on, iOS asks first, and the app never reads health data. This matches the port plan: a phone switch, "Save walks to Apple Health", off by default and write-only; the watch follows it; Breathe writes Mindful Minutes.
- **Privacy, this website:** it now says the site stores the Daylight/Evening and Motion choices in your browser, keeps an offline copy of the tools, sends no referrer, and sees your address if you email.
- **Support:** names and numbers also go into a backup file if you make one. The backup answer is complete, and "Find A Helpline" is now "findahelpline.com".
- **Home:** the Text button for trusted contacts isn't in Ride it out. It's on Home and after a hard moment. "Hold it, or tap Start walk now".
- **Premium:** buying isn't live, so the text is now future tense: "When Premium launches, Apple will handle payments and refunds…". "Price to be announced" is kept, and there are no figures anywhere.
- **Terms:** removed "a monthly or yearly plan" (not decided). Now: "Plans and the price for your country will be shown in the app before you buy." Last updated November 16, 2026.
- **Ride:** "Urges often rise, peak and pass" (it was "An urge rises, peaks and passes", which read as a promise).
- **Ride:** its share description now matches its search description.

**Search and links:**
- Added a site-styled `404.html` with a link home, the three tools, and 988 and findahelpline. It uses `<base href="/">` so it works at any depth.
- Added `robots.txt`. Both used to fall through to GitHub's error page, sometimes as a 503.
- Added canonical links on every page.
- Added `og:image` width, height and alt text.
- `<meta charset>` now comes first.
- Longer descriptions for Privacy, Terms, Support and Helpers.
- The manifest gets `"id": "/"`.

**Security:**
- A Content-Security-Policy meta tag on every page: same-origin only, with inline scripts allowed by their hash.
- `<meta name="referrer" content="no-referrer">`, so findahelpline, Discord, Apple and the credit sites no longer learn a visitor came from urgewalk.app.
- **Service worker** (cache `uw-2026-11-16-r4`): pages are saved only when the response is OK, so a 404 or 503 is never kept for offline use. They're saved without the query string, so copies don't pile up.
- **Workflow:** `permissions: contents: read`, checkout pinned to a commit, and `persist-credentials: false`.

**Accessibility:**
- **Ride it out button:**
  - It now comes second in the Tab order, right after the header. It used to be last, after the footer.
  - It steps aside while it would cover a tool's own buttons. On a 375 × 812 phone it hid 88% of Ground's Next.
  - The tool pages have room under the controls on small screens.
- **Focus ring:** 2 px, with a dark halo. It was 1 px and measured 2.3:1 against the evening sky.
- **Crisis line on the tool pages and Ride:** now on a soft dark backing in paper colour. It measured 2.0 to 2.9:1 over bright photos, and Ride also lost its 0.85 opacity.
- **Ride:**
  - The clock is no longer read out every second (`aria-live="off"`, as on Walk).
  - The nav no longer marks Breathe as the current page.

## Not fixed (and why)

**Needs the founder's eye: a visible design change.** Text over bright photographs is below 4.5:1 in places, before you scroll:
- the header on Breathe, Ground, Premium, Privacy and Support (1.9 to 2.5:1)
- the hero cap and h1
- the Outlook's "Passed. Eased. Stayed." captions (from 1.9:1)
- the Clearing and Shore captions
- the place labels on the tool pages

The fix is a deeper veil, or a scrim behind the words. That changes the look, so it should be its own PR with before and after shots.

**Founder's call:**
- **Premium free list:** "Every place … and the optional sounds" and the Walk web tool are promised free on the site, but missing from the app's own free list (`src/content/free-features.json`). Either the app's list or the site needs to change.
- **"Why I made this" on Home:** it mentions "my own toughest stretches". Confirm you want that public.
- **Support:** it still mentions swiping in from Home's left edge. Still waiting on his decision.

**Needs Cloudflare or GitHub settings (founder only):**
- security headers (HSTS, nosniff, framing) through the Cloudflare proxy, which would change the privacy page's hosting line
- a CAA record for letsencrypt.org
- DMARC moved from `p=none` to `p=quarantine`
- read-only default workflow access

**Smaller, left for later:**
- **Without JavaScript:** the Ride it out button, the light switch and the tool buttons do nothing, and there's no note saying so.
- **Walk lengths:** a radiogroup without arrow keys.
- **Daylight/Evening buttons:** 30 px tall. That passes AA, but is below 44 px.
- **The Motion button:** changes its label and its pressed state together.
- **"Why I made this":** isn't a heading.
- **Pausing the videos:** only possible from the footer.

**At launch:**
- remove noindex
- add `sitemap.xml` and its line in robots.txt
- add JSON-LD (`WebSite`, and `SoftwareApplication` only once released)
- maybe point the Unsplash+ credit at the license page
- reword Privacy's "Expo" line for the SwiftUI app
- before Premium: add purchase data to Privacy

**The repo is public:** `records/`, `scripts/` and `previews/` aren't served, but anyone can read them on GitHub.

## Checked and correct

- **Release status:** "Coming to iPhone" and "no date yet". There's no App Store link, badge or "Download" anywhere, which fits an App Store Connect record existing for an unreleased app.
- **Pricing:** TBD everywhere, with no figures.
- **The app's facts:**
  - Island light 5:00 to 16:59
  - place names
  - Ride it out's four answers
  - Breathe 4-3-6
  - Walk lengths
  - Passed / Eased / Stayed
  - the 24-hour undo
  - three trusted contacts
  - 18+ setup
  - the App lock and the Journal and reasons locks
  - Backup & restore, and Reset app
  - nothing sent (no network, analytics or crash-reporting code in the app)
  - permissions asked only when needed
  - the crisis lines 988, SAMHSA, 911 and findahelpline
- **Links:** all 45 internal targets and anchors return 200; mailto, tel:988, findahelpline, the Apple EULA and Discord all work. There are no github.io links (the old address returns 301).
- **No third-party requests:** fonts are self-hosted and there are no outside scripts. No secrets in Git history, no EXIF location in the images, and `records/`, `scripts/` and `previews/` return 404 live.

## Verification (branch `site/walk-day-and-audit-2026-11-16`, served locally)

- **Parity** (app `376b215`): 34 pictures, 0 failed, 0 to look at.
- **Light switch:** 67 pictures, 0 failing.
- **Every page plus the 404** (also at a nested address), at 375 and 1440 px: no CSP violations, no script errors, no broken images, no sideways scroll. The switch clicks both ways.
- **Reduce Motion, Motion off, no-JS:** nothing plays and the stills show.
- **Ground at 375 × 812:** Next is no longer covered (the button steps aside). On Home, Tab reaches Ride it out fifth, right after the light switch; it used to be stop 39.
- **Other checks:** the hidden-Unicode check passes, the manifest parses, `site.js` and `sw.js` parse, and the heads were checked.
- **Before and after:** `previews/audit-2026-11-16-{path-1440,path-390,walk-390,ground-390}.jpg` (live on the left, the branch on the right).
- **Not checked:** a real iPhone, Safari, VoiceOver.

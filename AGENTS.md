# Agent notes

Read `DESIGN-RULES.md` before any UI or copy change; it overrides defaults.

## Nov 8 2026 island restyle

- `index.html` rebuilt in the app's look (mockup A, founder: "Build it"): hero over the Sheltered Coast, Ride it out ("What feels doable right now?"), "What did the urge do?" on glass over the Path Ahead, Places around the island (Path Ahead, Trailhead, Shelter, Outlook), Private by design on glass over the Cove, Why I made this (founder's full text), Coming soon. The Pexels wave video and its credit are gone. Every other page inherits the night palette and fonts from the island layer in `style.css`.
- Images: `assets/island/` (screens: real captures of the current app via headless Chrome against the Expo web build, 390 × 844 at 3×, daylight, sample data; place bands: web-size crops of the app's Unsplash+ plates). These are added only with the founder's explicit go-ahead, because his standing rule keeps Unsplash+ plates out of anything shared (see the app repo record `2026-11-08--tonight-port-prep-and-site.md`).
- Privacy page: the permission list now matches the app (Contacts, Photos, Microphone, Face ID, Notifications, each optional); last updated Nov 8. Premium page: the free list names the island's places instead of the retired Tide/Stones/Trail Home scenes.

## Nov 8 2026 update (copy, icon)

- Copy matches the current app: Ride it out lives on Home and in the top bar of every place (the tab bar was removed); check-in outcomes are Passed / Eased / Stayed ("What did the urge do?"); ten places (the Inlet is now The Tide Pool; The Cove was added); places follow the time of day and never change with progress (app rule: scenery never reflects progress or setbacks).
- Icon: W6 mark replaces the A2/v4/v5 files in every page's head and header (see DESIGN-RULES.md). Old v4/v5 files stay in `assets/` until the change is live, then can go.
- Still pending: the phone screenshots are the v4.1 bridge mockups, not the current app; some show the old Inlet name inside the image. Replacing them with real captures of the current app is a founder decision: the app's place photographs are Unsplash+ (licence allows commercial and marketing use, no credit; raw photo files must never be committed here).

## Current Website Status (v4.1 Whole-Island Screenshots)

The live landing page (`index.html`) showcases the **Whole-Island v4.1 architecture (`sheltered_island_v1`)** using composed 780×1640 app screenshots with phone frames. 

> [!NOTE]
> Superseded Nov 8 2026 by the island restyle above. These screenshots were a temporary bridge presentation on the website until the new designs and components are reworked directly in Expo (`C:\GitHub\urge-walk-app`).

### Screenshot Configuration & Display Rules
- **Daylight Variants Only**: All 14 phone frames across the page deliberately display the **Daylight** versions (`screen-*-day.webp`). The evening screenshots were removed from the live markup to ensure crisp, high-contrast visibility and legibility when visitors view the website in dark mode (where the page background is deep navy `#0f1d33`).
- **Standardized Display Dimensions**: All phone frames render at a uniform **220px width** (`~462px height`) across hero, feature sections, onboarding, and the gallery. The hero frame must not render larger than the other frames on desktop.
- **Image Attributes**: All phone frames maintain `width="780" height="1640"`.

### Island Places Mapping (Daylight)
- **Place 1: The Sheltered Coast** (`screen-1-sheltered-coast-day.webp`) — Hero & Gallery
- **Place 2: The Trailhead** (`screen-2-trailhead-day.webp`) — Places around the island & Onboarding (Arrival)
- **Place 3: The Cottage** (`screen-3-cottage-day.webp`) — Gallery (You)
- **Place 4: The Shelter** (`screen-4-shelter-day.webp`) — Gallery (Journal)
- **Place 5: The Clearing** (`screen-5-clearing-day.webp`) — Places around the island & Onboarding (Ride it out)
- **Place 6: The Path Ahead** (`screen-6-path-ahead-day.webp`) — What's inside & Gallery (Active walk with timer)
- **Place 7: The Inlet** (`screen-7-inlet-day.webp`) — Places around the island & Gallery (Breathe)
- **Place 8: The Shore** (`screen-8-shore-day.webp`) — Gallery (Ground)
- **Place 9: The Outlook** (`screen-9-outlook-day.webp`) — Gallery (History / Logbook)

### Source Material
- Proposal HTML: `urge_walk_whole_island_v4_1_architecture_restraint_continuity_proposal.html`
- Screenshot archive: `urge-walk-v4.1-screenshots-18-webp.zip`

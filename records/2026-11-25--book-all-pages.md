# 2026-11-25: every page is the book

Founder: "Looks good. Do the full site. Current visuals and everything."

Done on `site/book-all-pages-2026-11-25` (PR open, not merged):
- Home contents now lists all nine plates with the app's names (V The Cove, VIII The Way On were missing; III is The Still Pool, not The Open Water). Only II to IV link.
- Privacy, Terms, Support, For helpers, Premium, 404, Walk, Breathe, Ground and Ride one out restyled as the book; Community is new. Same header with Help 988, same footer, evening paper from the app.
- Words on Privacy, Terms and Support unchanged. Tools' behaviour and no-JS fallbacks unchanged.
- Deleted: `site.css`, `places.css` (no page uses them). Not deleted: the island's pictures in `assets/places`, `assets/screens` and most of `assets/motion` are now unused by any page, and `scripts/` still has island tools; listed for the founder to decide.
- Plates II to IV on home use the current app captures (walk, breathe, ground, day and evening) in `assets/screens/book/`. The Watch plate is text only: no Watch capture exists.

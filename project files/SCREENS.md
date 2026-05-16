# Wildr — Screens Checklist
*Categorised by priority. Updated as screens are designed and built.*
*Last updated: 2026-05-16 — audit pass + build summary by Claude (practical-babbage-d221ae)*

---

## Status key
- `[x]` — Built and functional
- `[~]` — Partially built / has known issues (see notes)
- `[ ]` — Not built

---

## P0 — Core (MVP must-haves)

- [x] **Splash** — full editorial dark-forest landing, animated pine horizon, lime CTA, Log in link
- [x] **Sign Up** — email, username, password (Register.jsx) → 3-step Onboarding flow (bio, avatar, location detect, interests grid with SVG icons)
- [x] **Login** — email + password, JWT stored, redirects to Home
- [~] **Home / Feed** — hero photo, weather widget, map panel, sighting feed, saved places + community sidebar
  - Bug: Community map toggle is a no-op (data not fetched yet — `// TODO`)
  - Bug: Community sightings in home feed still hardcoded empty
  - UX: "Today's Quest" is hardcoded placeholder text
- [x] **Camera Capture** — photo tab inside Identify.jsx: camera stream mode + file upload mode, proper padding on web
- [x] **Audio Capture** — audio tab inside Identify.jsx: hold-to-record, real-time chunk streaming to API, waveform state. Tab auto-switches based on URL (`/identify/audio`)
- [x] **ID Result (Photo)** — ResultCard: full-bleed species photo, confidence score, top 3 suggestions if uncertain, endangered banner, "Log sighting" button, first-sighting callout, new badge callout
- [x] **Audio Result** — same ResultCard as photo (shared component)
- [x] **Species Detail** — SpeciesDetail.jsx: habitat, behaviour, seasonal note, conservation status badge, rarity badge, endangered banner, photo carousel, back link. Uses design tokens (no hardcoded Tailwind colors).

---

## P1 — Discovery & Map

- [~] **Map View** — Map.jsx: personal sightings + greenspaces + water bodies on Mapbox, clustered pins, popup on tap, filter toggle buttons (Community/Personal/Saved/Others)
  - Bug: Community layer toggle does nothing (data not fetched — `// TODO`)
  - Missing: "Species by Map" mode (zoom → see species in area)
- [x] **Species Browse** — Species.jsx: full species list, search by name (with optional limit param), filter by kingdom / rarity / conservation status, links to SpeciesDetail
- [ ] **Species by Map** — browse species sighted in a region, auto-focus user location, search any city. Not built.
- [x] **Location Detail** — LocationDetail.jsx: name, type, sighting count, save/unsave (toast feedback), sighting list with species names (via join)
  - Missing: reviews, star rating (planned in original spec but not built)
- [x] **Search** — Search.jsx (`/search`): unified search across species and people, tab switcher (Species / People) with live result counts, debounced API calls, suggestion chips, search icon in NavBar (desktop), link in mobile menu

---

## P2 — Social & Walks

- [ ] **Walks List** — Walks.jsx is a stub (`<div>Walks</div>`). Route exists (`/walks`) but unreachable from UI. Backend routes exist.
- [ ] **Walk Detail** — WalkDetail.jsx is a stub. Route exists (`/walks/:id`).
- [ ] **Create Walk** — not built, no route registered
- [x] **Profile (own)** — Profile.jsx: 3 tabs (View / Edit / Prefs). View tab: stats (sightings/badges/friends/saved places), level badge with XP bar, recent sightings, badges summary → `/badges`, life list grouped by kingdom. Edit tab: avatar upload, bio, location, change password. Prefs tab: community share, anonymise, iNaturalist share toggles.
  - Missing: interests not displayed in View tab (collected in onboarding but not shown)
  - Missing: walks section
- [x] **Profile (other user)** — UserProfile.jsx (`/users/:id`): redirects to `/profile` if own ID. Shows sightings, badges, friend button (Add/Pending/Accept/Friends), level chip, public stats. Friends page links to user profiles.
- [x] **Friends** — Friends.jsx: user search (links to user profiles), send request, accept/reject pending, unfriend with confirm, email invite with invite history (pending/joined status)
- [~] **Notifications** — NavBar has bell icon dropdown: fetches `/notifications/me`, shows unread count badge, mark-all-read. Dedicated `/notifications` page route exists and loads notifications list.
  - Missing: no push / native notification support

---

## P3 — Settings & Polish

- [x] **Settings** — Settings.jsx (`/settings`): linked from NavBar dropdown.
- [x] **Edit Profile** — implemented as "Edit" tab inside Profile.jsx: avatar URL or upload, bio, location name, change password. Saves to `/users/me`.
- [x] **Badges** — Badges.jsx: redesigned to show ALL 37 badges (locked + earned) grouped by 5 categories (Explorer / Life List / Kingdom Expert / Rarity Hunter / Conservation Champion) with progress bars per category, earned date for unlocked badges. Locked badges shown dimmed.

---

## Extra screens built (not in original spec)

- [x] **Forgot Password** — ForgotPassword.jsx: email input → API call → shows "Check your email"
- [x] **Reset Password** — ResetPassword.jsx: reads `?token=` from URL, new password form
- [x] **Log Sighting (manual)** — LogSighting.jsx (`/log-sighting`): species search (autocomplete), place nickname with suggestions, named location picker, notes, GPS coords captured automatically. Confirm → success screen.
- [x] **My Sightings** — Sightings.jsx: full personal sightings list, filter by kingdom, edit via modal, delete with confirm, rarity badges, weather data
- [x] **404 Not Found** — NotFound.jsx: shown for any unregistered route via `<Route path="*">`

---

## User Level System

XP formula: `sightings × 10 + unique_species × 25 + badges × 50`

| Level | Name | XP |
|---|---|---|
| 1 | Wanderer | 0 |
| 2 | Spotter | 100 |
| 3 | Observer | 300 |
| 4 | Tracker | 750 |
| 5 | Ranger | 1,500 |
| 6 | Naturalist | 3,000 |
| 7 | Field Expert | 6,000 |
| 8 | Ecologist | 12,000 |
| 9 | Master Naturalist | 25,000 |
| 10 | Wild Guardian | 50,000 |

- **`GET /users/me/level`** — returns level, level_name, xp, xp_for_next, progress_pct
- **`GET /users/level/:id`** — same for any user
- Shown in Profile (level badge + XP bar) and UserProfile (compact level chip)

---

## Badge System (37 badges, 5 categories)

Run `ALTER TABLE badges ADD COLUMN IF NOT EXISTS category VARCHAR(50);` then re-seed from `backend/seed_badges.sql`.

**Explorer** (6): First Find, Naturalist, Field Expert, Seasoned Observer, Wild Century, Thousand Sightings  
**Life List** (5): Curious Mind, Species Hunter, Encyclopaedia, Wild Almanac, Living Field Guide  
**Kingdom Expert** (15): Birder, Master Birder, Flock Watcher, Botanist, Plant Doctor, Fungi Finder, Mycelium Master, Insect Eye, Entomologist, Mammal Watch, Beast Master, Reptile Spotter, Cold Blooded, Puddle Hunter, River Reader  
**Rarity Hunter** (6): Uncommon Eye, Lucky Find, Rarity Chaser, Rare Spotter, Legendary Find, Ultra Rare  
**Conservation Champion** (4): Guardian, Advocate, Red List Ranger, Species Sentinel

---

## What remains to build

### High priority

| Task | File | Notes |
|---|---|---|
| Community sightings feed | Home.jsx, new backend endpoint | `// TODO` in Home.jsx map panel and feed |
| Community map layer | Map.jsx | Toggle exists but does nothing |
| Display interests in Profile View tab | Profile.jsx | Collected in onboarding, not shown |

### Medium priority — Walks (v2)

| Screen | Work |
|---|---|
| **Walks List** (`/walks`) | Fetch `/walks`, render walk cards, link to Walk Detail |
| **Walk Detail** (`/walks/:id`) | Stop list, ordered stops, species per stop, difficulty, start CTA |
| **Create Walk** (`/walks/new`) | Add stops, title, difficulty selector, save |

Backend walks routes already exist — frontend stubs need replacing.

### Lower priority

| Task | Notes |
|---|---|
| Location Detail reviews/ratings | DB schema + backend + frontend |
| Species by Map mode | Map pan/zoom re-query |
| Push notifications | Native or web push |
| Kingdom filter in onboarding affecting recommendations | Design decision pending |
| Change email confirmation flow | Email verification |

---

## Known bugs

| Bug | Location | Priority |
|---|---|---|
| Community map toggle is a no-op | Map.jsx, Home.jsx | High |
| "Today's Quest" is hardcoded | Home.jsx | Medium |
| Community home feed empty | Home.jsx | High |
| Walks pages are stubs | Walks.jsx, WalkDetail.jsx | Medium |

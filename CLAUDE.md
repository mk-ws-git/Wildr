# Wildr — Project Reference

Urban wildlife spotting app. Users log sightings, identify species, explore nearby greenspaces, and connect with friends.

**Private repo:** `mk-ws-git/wildr-full`
**Public repo exists separately — never push to it from this repo.**

---

## Repo layout

```
wildr-full/
  backend/          FastAPI app
  frontend/         React + Vite app
  supabase_init.sql Full DB schema (apply to Supabase manually)
  seed_species.sql  Species seed data
  seed_badges.sql   Badge seed data
  .env              Local env vars (gitignored)
  .env.example      Env var reference
  .mcp.json         Supabase MCP config (project ref: gsstcquplvnfrmerntsc)
  moodboard.*       Design reference (PDF/PNG/HTML)
```

---

## Backend (`backend/`)

**Stack:** FastAPI, SQLAlchemy (async), asyncpg, Pydantic v2, httpx

**Run:** `uvicorn app.main:app --reload` (from `backend/`)

**Routes** (`app/api/routes/`):

| File | Prefix | Notes |
|---|---|---|
| `auth.py` | `/auth` | Register, login, password reset |
| `users.py` | `/users` | Profile, `/users/search?q=` |
| `friendships.py` | `/friendships` | Send/accept/reject/delete, `/me`, `/pending` |
| `invitations.py` | `/invitations` | Email invites via Resend |
| `sightings.py` | `/sightings` | CRUD, photo upload |
| `species.py` | `/species` | Search, detail |
| `identify.py` | `/identify` | Photo ID via Anthropic Claude |
| `photos.py` | `/photos` | `/daily` (auth), `/auth-panel` (public) |
| `notifications.py` | `/notifications` | Bell feed |
| `badges.py` | `/badges` | User badge progress |
| `locations.py` | `/locations` | Named place nicknames |
| `greenspaces.py` | `/greenspaces` | Nearby green spaces |
| `water_bodies.py` | `/water_bodies` | Nearby water |
| `walks.py` | `/walks` | Recorded walks |
| `weather.py` | `/weather` | Current conditions |
| `health.py` | `/health` | Health check |

**No Alembic.** Schema changes go in `supabase_init.sql` and are applied manually via the Supabase dashboard or MCP tools.

**Key env vars** (see `app/core/config.py` for full list):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | asyncpg connection string |
| `SECRET_KEY` | JWT signing |
| `UNSPLASH_ACCESS_KEY` | Unsplash API |
| `ANTHROPIC_API_KEY` | Species ID via Claude |
| `RESEND_API_KEY` | Email invites |
| `MAPBOX_TOKEN` | Map tiles |
| `R2_*` | Cloudflare R2 media storage |
| `INAT_API_TOKEN` | iNaturalist (optional) |

---

## Frontend (`frontend/`)

**Stack:** React 18, Vite, Zustand, Axios, Tailwind (utility classes) + inline styles

**Run:** `npm run dev` (from `frontend/`)

**Pages** (`src/pages/`):

| File | Route | Notes |
|---|---|---|
| `Splash.jsx` | `/` (unauthenticated) | Landing / splash screen |
| `Login.jsx` | `/login` | Uses `AuthShell` |
| `Register.jsx` | `/register` | Uses `AuthShell`, triggers onboarding |
| `ForgotPassword.jsx` | `/forgot-password` | |
| `ResetPassword.jsx` | `/reset-password` | |
| `Onboarding.jsx` | `/onboarding` | Post-registration flow |
| `Home.jsx` | `/` | Hero photo, weather, sightings feed |
| `Friends.jsx` | `/friends` | Search users, friend requests, email invites |
| `Profile.jsx` | `/profile` | Edit profile, preferences, badges |
| `Sightings.jsx` | `/sightings` | Feed of all sightings |
| `LogSighting.jsx` | `/log` | Manual sighting log form |
| `Identify.jsx` | `/identify` | Photo species identification |
| `IdentifyAudio.jsx` | `/identify/audio` | Audio species identification |
| `Species.jsx` | `/species` | Species browser |
| `SpeciesDetail.jsx` | `/species/:id` | |
| `Map.jsx` | `/map` | Interactive map |
| `LocationDetail.jsx` | `/locations/:id` | |
| `Badges.jsx` | `/badges` | |
| `Walks.jsx` | `/walks` | |
| `WalkDetail.jsx` | `/walks/:id` | |

**Key components** (`src/components/`):

- `AuthShell.jsx` — split-panel layout for all auth pages. Left panel fetches `/api/photos/auth-panel` (public endpoint) for a daily nature photo with Unsplash attribution. Exports `AuthHeading`, `AuthField`, `AuthTextarea`, `AuthBtn`, `AuthError`, `AuthLinks`.
- `NavBar.jsx` — bottom nav + notifications bell
- `PineTrees.jsx` — animated pine-tree loader
- `ProtectedRoute.jsx` — redirects to `/login` if no auth
- `Toast.jsx` — global toast notifications
- `WeatherIcon.jsx` — SVG weather icons
- `MapPanel.jsx` — reusable map panel
- `LocationSearch.jsx` — location search input

**Auth:** Zustand store at `src/store/authStore`. JWT stored in localStorage. API calls via `src/api/client` (Axios instance with auth header).

**Design system:** CSS variables on `:root` — Nordic Wild + lime palette.

| Var | Role |
|---|---|
| `--bd-moss` | Primary green (buttons, accents) |
| `--bd-ink` | Primary text |
| `--bd-ink-mute` | Muted text |
| `--bd-ink-soft` | Label text |
| `--bd-bg` | Page background |
| `--bd-card` | Card background |
| `--bd-rule` | Border / divider |
| `--bd-rule-soft` | Lighter divider |

---

## Unsplash integration

- **`GET /photos/daily`** (auth required) — fetches a random nature photo by day-seeded query, fires the Unsplash download trigger, returns `photo_url`, `description`, `photographer`, `photographer_url`.
- **`GET /photos/auth-panel`** (public) — same fetch logic, daily in-memory cache, used by `AuthShell.jsx` on login/register pages.
- Attribution format everywhere: `Photo by [Name](photographer_url) on [Unsplash](https://unsplash.com)` — both linked.
- Fallback photos (no API key / API failure): hardcoded CDN URLs in `FALLBACK_PHOTOS` list in `photos.py`. No download trigger for fallbacks.

---

## Friendships

**Backend** (`app/api/routes/friendships.py`):
- `POST /friendships` — send request (`addressee_id` in body)
- `PATCH /friendships/{id}` — accept / reject / block
- `DELETE /friendships/{id}` — unfriend
- `GET /friendships/me` — accepted friends list
- `GET /friendships/pending` — incoming pending requests

**Model:** `friendships` table, `friendship_status` enum (`pending`, `accepted`, `blocked`). Both defined in `supabase_init.sql`.

**Frontend** (`src/pages/Friends.jsx`): user search via `GET /users/search?q=`, send requests, accept/reject pending, email invite panel with invite history.

---

## Git / deployment

- **Main branch:** `main`
- **Development branches:** `claude/...` prefixed
- No CI configured. Deploy manually.
- Supabase project ref: `gsstcquplvnfrmerntsc` (see `.mcp.json`)

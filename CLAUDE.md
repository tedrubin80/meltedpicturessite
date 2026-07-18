# CLAUDE.md — Melted Pictures

Source of truth for agents and humans working on this repo: what the site is, how it works today, and what we are building next.

## Project overview

| | |
|---|---|
| **Brand** | Melted Pictures |
| **Tagline** | Where AI Meets Nightmare |
| **Domain** | `meltedpictures.com` / `www.meltedpictures.com` |
| **Purpose** | Public portfolio/marketing site for an AI horror & thriller film studio, plus a custom admin CMS |

**Stack (do not assume React/Next):**

- **Frontend:** Multi-page static HTML + vanilla JS + hand-written CSS
- **Backend:** Node.js Express (`server/index.js`)
- **Database:** PostgreSQL via `pg`
- **Auth:** `express-session` + `bcrypt` (cookie `mp.sid`)
- **Security:** `helmet`, `cors`, `express-rate-limit`, `cookie-parser`
- **Node:** `>=18`

## Architecture

```
Public HTML (index, films, about, contact, films/*)
  → js/main.js, js/films-loader.js
  → /api/films/public, /api/settings (partial use)

Admin SPA (admin/)
  → /api/auth, /api/films, /api/settings

Express (server/index.js)
  → PostgreSQL (users, films, settings, sessions, activity_log)

Deploy: nginx → Node :3000
  (setup-production.sh, meltedpictures.com.nginx)
```

### Key paths

| Path | Role |
|------|------|
| `index.html`, `films.html`, `about.html`, `contact.html` | Public pages |
| `films/the-hollow-signal.html` | Only static film detail page that exists |
| `css/style.css` | Public site styles |
| `js/main.js` | Nav, filters, contact form (client-only), motion |
| `js/films-loader.js` | Loads public films from API into home/films grids |
| `admin/` | Admin UI (`index.html`, `admin.js`, `admin.css`) |
| `server/index.js` | Express app entry |
| `server/db/init.js` | Schema + initial admin/settings |
| `server/db/index.js` | DB pool |
| `server/routes/auth.js` | Login, logout, me, change-password |
| `server/routes/films.js` | Public list/slug + admin CRUD + dashboard stats |
| `server/routes/settings.js` | Public/admin settings + activity log |
| `server/routes/pages.js` | Dynamic `/film/:slug` HTML |
| `server/middleware/auth.js` | Session auth helpers |
| `server/uploads/` | Uploaded posters/backdrops (gitignored except `.gitkeep`) |
| `.env.example` | Env var template |
| `setup.sh` / `setup-production.sh` | Local and production setup |

### Public routes

| Route | Source |
|-------|--------|
| `/` | `index.html` |
| `/films.html` | Film catalog |
| `/about.html` | About |
| `/contact.html` | Contact + FAQ |
| `/films/the-hollow-signal.html` | Static film detail |
| `/film/:slug` | Dynamic film detail from DB |
| `/admin`, `/admin/*` | Admin SPA |

### API surface

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | login, logout, me, change-password (login rate-limited) |
| `/api/films` | public list/slug + admin CRUD + dashboard stats |
| `/api/settings` | public/admin settings + activity log |
| `/api/subscribe` | Newsletter → Listmonk proxy |
| `/api/contact` | Contact inquiries → DB + admin inbox |
| `/api/uploads` | Authenticated image upload (multer) |
| `/api/health` | Health check |

## Features as they exist today

### Public site

- **Home** — Fixed nav, hero, featured film, films grid, about preview, stats, footer. Featured/grid can be overwritten by `/api/films/public` when the API is available; otherwise static HTML fallbacks.
- **Films** — Genre filters (All / Horror / Thriller / Sci-Fi / Shorts). Dynamic grid `#dynamic-films-grid` from API, else `#static-films-grid`. Some static film card links point at HTML files that do not exist.
- **About** — Vision, philosophy, process steps, stats, CTA.
- **Contact** — Mailto emails (`hello@` / `press@meltedpictures.com`), FAQ, contact form. **Form is client-only:** submit shows an `alert` and resets; no backend email delivery.
- **Film detail** — Static Hollow Signal page + server-rendered `/film/:slug` with YouTube embed, credits, related films.
- **UX** — Mobile hamburger nav, header scroll styling, fade-in via IntersectionObserver, light hero parallax, prefetch film pages on card hover.

### Admin CMS (`/admin`)

- Session login (bcrypt); auth rate limit 5 / 15 min.
- **Dashboard** — Totals (films, published, drafts, views), recent films, quick actions.
- **Films** — List with status/genre/search; create/edit/delete/preview.
- **Film editor** — Title, synopsis, YouTube ID, description, director/writer/credits, status/featured, year/genre/duration/rating/date, poster/backdrop **URLs**, tags.
- **Settings** — Site name/tagline/description, social URLs, contact emails, change password.
- **Import/Export** — JSON backup of films (client-side in `admin.js`).

### Database tables (`server/db/init.js`)

`users`, `films`, `settings`, `sessions`, `activity_log`, `contact_messages`

Sessions are stored in PostgreSQL via `connect-pg-simple` (`sessions` table).

### Integrations live

- YouTube embeds (CSP allows youtube frames)
- Google Fonts (Inter)
- Listmonk newsletter (server proxy; requires env)
- Optional Plausible analytics (Settings → plausible_domain)

### Status / remaining gaps

| Item | Status |
|------|--------|
| Newsletter | Wired → Listmonk (needs env) |
| Contact form | Wired → admin inbox (no outbound email yet) |
| Settings → public | Wired via `js/site-settings.js` |
| Film catalog | `/film/:slug` + API |
| Image uploads | Wired → `POST /api/uploads` |
| Sessions | Postgres via `connect-pg-simple` |
| `db:seed` | Wired |
| Analytics | Opt-in Plausible via Settings |
| Payments | None |
| Design polish | Still open (typography / brand presence) |

## How to work in this repo

### Scripts

```bash
npm start          # node server/index.js
npm run dev        # node --watch server/index.js
npm run db:init    # create schema + initial admin/settings
npm run db:seed    # sample published films (skips existing slugs)
```

### Environment

Copy `.env.example` → `.env`. Current vars:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SESSION_SECRET`
- `PORT`, `NODE_ENV`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (initial admin via `db:init`)
- Production may also use `CORS_ORIGIN`

### Setup

- Local: `setup.sh` (DB + npm)
- Production: `setup-production.sh` (nginx + Certbot SSL), config in `meltedpictures.com.nginx`

### Conventions

- This is **not** a React/Next app. Prefer editing existing multi-page HTML, vanilla JS, Express routes, and hand-written CSS.
- Public look: dark cinematic / horror (`#0a0a0a` backgrounds, dark red accent `#8b0000`, Inter + system fallbacks). Preserve this language unless the task is design polish.
- Do **not** introduce a framework migration unless explicitly asked.
- Keep changes scoped; match existing naming and file layout.
- Never commit secrets (`.env`, Listmonk tokens, etc.).
- Only create git commits when the user explicitly asks.

## Agreed roadmap (living backlog)

Priorities in order. Update this section as items ship.

### 1. Newsletter / subscription → Listmonk — DONE (needs env)

Public footer newsletter form on all main pages + dynamic film pages.  
`POST /api/subscribe` proxies to Listmonk `POST /api/subscribers` (Basic auth).  
Honeypot + rate limit (10 / 15 min). No subscriber PII stored in our DB.  
Double opt-in left to Listmonk (`preconfirm_subscriptions: false`).

**Env required** (see `.env.example`):

```
LISTMONK_URL=
LISTMONK_API_USER=
LISTMONK_API_TOKEN=
LISTMONK_LIST_UUID=   # preferred — Film Production list UUID
LISTMONK_LIST_ID=     # optional numeric fallback
```

Subscribe uses `POST /api/public/subscription` when `LISTMONK_LIST_UUID` is set; otherwise authenticated `POST /api/subscribers` with `LISTMONK_LIST_ID`.

Files: `server/routes/subscribe.js`, footer forms in public HTML + `server/routes/pages.js`, `js/main.js`, `css/style.css`.

### 2. Wire contact form — DONE (admin inbox)

`POST /api/contact` stores inquiries in `contact_messages` (honeypot + rate limit).  
Admin **Messages** section: list, mark read/unread, delete, unread badge.  
Separate from Listmonk newsletter. Optional outbound email notification can be added later.

### 3. Apply admin settings on public pages — DONE

`js/site-settings.js` loads `/api/settings/public` and applies:
- `data-setting-text` (description/tagline copy)
- `data-setting-mailto` (contact/press emails)
- `data-setting-href` (social URLs; empty URLs are hidden)

### 4. Film catalog consistency — DONE

Static film links use `/film/:slug`. API grids hide static fallback when data loads. Footer film list updates from published films. Genre filters re-query dynamic cards.

### 5. Admin image uploads — DONE

`POST /api/uploads` (auth + multer) saves to `server/uploads/`, returns `/uploads/...` URL.  
Film editor: Upload Poster / Upload Backdrop buttons; URL fields still work.

### 6. Postgres-backed sessions + `db:seed` — DONE

Sessions use `connect-pg-simple` against the `sessions` table.  
`npm run db:seed` inserts sample published films (skips existing slugs).

### 7. Analytics — DONE (opt-in Plausible)

Admin Settings → Analytics → `plausible_domain`.  
`js/site-settings.js` injects Plausible when set. CSP allows `plausible.io`.

### 8. Design polish

Stronger brand presence and more distinctive typography than Inter, without abandoning the dark cinematic look. Follow existing public CSS patterns; avoid generic AI design clichés when redesigning.

## Agent guardrails

1. Prefer existing HTML/CSS/JS/Express patterns over new frameworks or build tooling.
2. Listmonk (and any mail) credentials stay in env — never hardcode or commit them.
3. Newsletter (Listmonk) and contact inquiry flows stay separate.
4. Public UX: one job per section; new forms should feel native to the dark site.
5. Do not commit unless the user asks.
6. When touching film pages, prefer the dynamic `/film/:slug` path and API data over proliferating new static HTML duplicates.
7. If implementing roadmap items, update this file’s roadmap section to mark progress.

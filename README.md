# Community Events Platform

A modern, production-ready web platform for Pakistani, Indian, and South Asian communities to discover, publish, manage, and share religious and community events.

## Supported Event Types

Majlis · Milad · Mehfil-e-Naat · Dars · Quran Khwani · Jashan · Urs · Seerat-un-Nabi · Muharram · Ramadan · Iftar · Charity · Community · Educational

---

## Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Frontend   | Next.js 15, React 18, TypeScript, Tailwind CSS  |
| State      | TanStack Query, Zustand                          |
| Forms      | React Hook Form + Zod                            |
| Backend    | Node.js, Express, TypeScript                     |
| Database   | PostgreSQL + Prisma ORM                          |
| Storage    | Cloudinary                                       |
| Auth       | JWT (access + refresh), bcrypt                   |

---

## Project Structure

```
community-events/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── .env.example
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- Node.js >= 20
- PostgreSQL running locally
- Cloudinary account

### 2. Environment Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, Cloudinary credentials
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

```bash
cd apps/api
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed categories, countries, admin user
```

### 5. Start Development

```bash
# From the root — starts both frontend and backend
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

---

## API Reference

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Events
```
GET    /api/v1/events
GET    /api/v1/events/:slug
POST   /api/v1/events         (auth required)
PATCH  /api/v1/events/:id     (auth required)
DELETE /api/v1/events/:id     (auth required)
```

### Admin
```
GET   /api/v1/admin/dashboard         (ADMIN)
PATCH /api/v1/admin/events/:id/approve (ADMIN)
PATCH /api/v1/admin/events/:id/reject  (ADMIN)
```

---

## Default Admin Account

After seeding, an admin account is created:
- Email: `admin@communityevents.pk`
- Password: `Admin@123456`

> **Change this password immediately in production.**

---

## Environment Variables

See `.env.example` for all required variables.

---

## Development Phases

- [x] Phase 1: Project Foundation
- [x] Phase 2: Authentication (JWT + RBAC)
- [x] Phase 3: Database Schema (Prisma)
- [x] Phase 4: Events CRUD + Search
- [x] Phase 5: Image Upload (Cloudinary)
- [x] Phase 6: Frontend (Homepage, Events, Auth)
- [x] Phase 7: Saved Events UI
- [x] Phase 8: Admin Dashboard UI
- [x] Phase 9: Multi-step Event Creation Form
- [x] Phase 10: SEO + Performance
- [x] Phase 11: Testing & CI (Jest API suites, Vitest i18n tests, GitHub Actions)
- [x] Phase 12: Email & Notifications (verification, password reset, moderation emails, in-app notifications)
- [x] Phase 13: Profile & Account Settings (edit name/phone, change password with notification)
- [x] Phase 14: Organizer Detail Pages (`/organizers/[slug]`, SEO metadata, sitemap, create validation)
- [x] Phase 15: Admin Categories UI (create/edit/activate-deactivate, admin list API, validation)
- [x] Phase 16: Events Calendar View (month grid with date-range API filters, list/calendar toggle)
- [x] Phase 17: Event RSVPs (Interested/Attending toggles, counts on event detail, upsert API)
- [x] Phase 18: Events Map View (Leaflet/OSM markers from list coordinates, list/calendar/map toggle)
- [x] Phase 19: Event Sharing (WhatsApp/X/Facebook, copy link, QR code on event detail)
- [x] Phase 20: Organizer RSVP Dashboard (RSVP list per event for organizer/admin, attendees panel on My Events)
- [x] Phase 21: RSVP CSV Export (download attendee list from organizer dashboard)
- [x] Phase 22: RSVP Email Notifications (organizer notified on new RSVPs, 24h event reminders for attendees via hourly sweep)
- [x] Phase 23: Attendee QR Check-in (per-attendee QR pass, organizer camera/paste check-in, undo, checked-in column in CSV)
- [x] Phase 24: Free Dastarkhwan directory (42 seeded free food points for the poor & needy, city filter + search at /dastarkhwan)
- [x] Phase 25: Imambargahs / Karbalas directory (43 seeded historic & notable Shia sacred sites across 7 cities, city filter + search at /imambargahs)
- [x] Phase 26: Pakistan Places directory (71 seeded historical/religious/cultural/natural places, category + province filters + search at /places)
- [x] Phase 27: Darbars / Shrines directory (34 seeded Sufi shrines with saint, death year & Urs dates, province filter + search at /darbars)
- [x] Phase 28: Urs Calendar (36 researched/unverified Urs schedules with curated upcoming order, confidence levels & calendar anchors — Urs Calendar tab at /darbars)
- [x] Phase 29: Security hardening (account lockout after 5 failed logins / 15 min, CSRF origin guard on state-changing requests, trust proxy in production, extra Next.js security headers — on top of existing helmet/CORS/rate-limit/bcrypt/JWT/zod/upload allow-list)
- [x] Phase 30: Muharram jaloos (procession) routes — Procession model + seed of 32 entries (Lahore, Islamabad, Rawalpindi, Multan, Faisalabad: processions, road closures, city overview), public `GET /api/v1/processions` (city/month/day/kind filters, q search), and a city-tabbed Jaloos section with route highlights, Google Maps links and disclaimers on `/categories/muharram`
- [x] Phase 31: Charity directory — Charity model + seed of 29 organizations across 6 provinces (focus, 100%-policy notes, contacts, registration), public `GET /api/v1/charities` (country/province/city filters, `policy=100` flag, q search) + `GET /charities/facets`, and a country→province→city cascading-dropdown directory with 100%-policy badges and disclaimers on `/categories/charity`
- [x] Phase 32: SEO P1+P2 — root metadata (viewport/themeColor, OG image, icon, manifest, canonical, security headers on admin routes via `X-Robots-Tag`), canonicals + OG URLs on all public pages, and conversion of 5 client pages (`/events`, `/dastarkhwan`, `/imambargahs`, `/places`, `/darbars`) to server components with `generateMetadata`, server-side fetch (`fetchList`) and client explorer components hydrated with `initialData`
- [x] Phase 33: SEO P3+P4 — JSON-LD structured data (Organization + WebSite with SearchAction in root layout; BreadcrumbList on all public pages; ItemList on list pages; Event on detail pages) via shared `lib/seo.ts` builders + `JsonLdScript` component (with XSS-safe serializer escaping `<`/`>`/`&`/U+2028/U+2029), and sitemap pagination (fetches all pages of events/organizers up to 20×100, includes directory routes `/dastarkhwan` `/imambargahs` `/places` `/darbars`)
- [x] Phase 34: SEO P5 — migrated Google Fonts `@import` to `next/font/google` (Inter + Noto Naskh Arabic self-hosted via `--font-inter` / `--font-arabic` CSS variables, `display: swap`); eliminates render-blocking third-party font request
- [x] Phase 35: Discover events near you — `GET /api/v1/cities` (active cities + approved event counts) + `GET /api/v1/cities/:slug` (detail with category breakdown); `/cities` index and full `/cities/[slug]` hub page (hero, multi-layer Leaflet `CityMap` with Events/Free Food/Imambargahs layers, events grid, directory links, breadcrumb JSON-LD); `city` filter on `/events` (query param, chip UI, EventsExplorer + EventCalendar); City selector in the create-event form; sitemap `/cities` routes
- [x] Phase 36: Directory i18n — full ur/hi/ar translations for the 4 directory explorers (dastarkhwan, imambargahs, places, darbars): ~130 keys in `lib/i18n.ts` (headings, disclaimers, filters, confidence chips, calendar anchors, pagination, empty states) with locale-aware city/province labels; new `i18n-keys.test.ts` guard asserting every `t()` key path exists and no hardcoded UI strings remain
- [x] Phase 37: Event geocoding — `EventLocationPicker` in the create-event wizard (Leaflet mini-map: click to drop pin, drag to move, Nominatim "Find from address" auto-fill from venue/address/city, clear button, coords chip); optional `latitude`/`longitude` in create schema + payload + review step; both Leaflet consumers (`EventLocationPicker`, `CityMap`) lazy-loaded via `next/dynamic` + `ssr:false` wrappers to fix SSR `window is not defined` prerender crashes
- [x] Phase 38: Search / filter / pagination wiring — root cause: `initialData` seeded every new React Query key with the stale SSR payload (`staleTime: 60_000`) so `queryFn` never fired on page/city/search changes, and directory pages never read `searchParams` (filter state lived only in `useState`, never in the URL). Fixed: all 4 directory explorers (dastarkhwan, imambargahs, places, darbars) + events explorer now take a server-derived `seed` prop, pass `initialData` only when the query key matches, mirror state to the URL via `router.push`, and resync on back/forward; all list pages read `searchParams` (q/city/province/category/search/page) and fetch accordingly (`buildQuery`/`sanitizePage` helpers); `/events` honors `page` and its search-box × button no longer re-pushes the stale URL; category pages gained a search box + Prev/Next pager (`CategoryEvents`); Muharram Jaloos converted from a fixed in-memory 100-item list to API-driven search/city/month/pagination (`procession.service` + `useProcessions`, `pq`/`pcity`/`pmonth`/`ppage` params)
- [x] Phase 39: Melas directory — `Mela` (41 curated melas/festivals) + `AuqafUrsDate` (212-entry Punjab Auqaf urs calendar) models, idempotent seed from `prisma/data/pakistan-melas.json`, `GET /api/v1/melas` (q/city/province/type filters — city uses `contains` for multi-city rows like "Lahore, Eminabad", plus `GET /melas/:sourceId`) and `GET /api/v1/auqaf-urs-dates` (q/zone); 10 jest tests; web `/melas` page with `MelaExplorer` two-tab UI (Melas: city tabs + province select + search + URL-driven pagination; Auqaf calendar: zone select + search), seed/`initialData` pattern per Phase 38, Navbar + sitemap links, city-hub "Melas & Festivals" card, `melas` i18n namespace in all 4 locales, i18n-keys guard extended
- [x] Phase 40: Scholars directory (Shia & Sunni) — `Scholar` model (sect SUNNI/SHIA, category SCHOLAR/MARJA/KHATEEB, string birth/death dates, works[], sources JSON, city/country), idempotent seed of 96 scholars (53 Sunni + 43 Shia) from `prisma/data/scholars.json`, public `GET /api/v1/scholars` (q/sect/category/city filters, page/limit) + `GET /scholars/:sourceId`; 8 jest tests; web `/scholars` page with `ScholarsExplorer` (sect chips + role chips + search + URL-driven pagination, Darbars amber scheme), seed/`initialData` pattern, Navbar Directories entry + sitemap, `scholars` i18n namespace in all 4 locales, i18n-keys guard extended
- [x] Phase 41: Scholars integration — `/scholars` now honors `city` (searchParams → buildQuery → seed/state/pushUrl, active-city chip with clear button); city hub pages aggregate scholars (fetch, hero count, `hasDirectoryData`, Explore index row → `/scholars?city=…`; Lahore 4 / Karachi 6 / Peshawar 1 surface); home `DirectoryShowcase` gained a Scholars card (4 → 5 cards, grid `lg:grid-cols-4` → `lg:grid-cols-3 xl:grid-cols-5`)
- [x] Phase 42: Playwright E2E smoke suite — root `e2e/` workspace (`@playwright/test`, chromium only, `workers: 1` to respect auth rate limits); 13 tests across 7 specs covering home, directories (scholars + city param), city hub, events browse/search, auth (register/login/logout), 4-step event-create wizard, RSVP controls; shared `e2e/fixtures.ts` (API register/login/admin helpers, zustand `auth-storage` seeding via `addInitScript`, event create+approve); `playwright.config.ts` auto-starts API+web via full-path npm on Windows (`reuseExistingServer` in dev); also fixed `AuthGuard` to wait one client mount before redirecting so zustand persist can hydrate from localStorage (hard-refresh no longer bounces authenticated users to /login)
- [x] Phase 43: E2E in CI — new `e2e` job in `.github/workflows/ci.yml` (`needs: ci`, 20-min timeout): postgres service, schema push + seed (admin account + categories the suite depends on), `npx playwright install --with-deps chromium`, `npm run test:e2e`, Playwright HTML report + traces uploaded as artifacts on failure; placeholder `CLOUDINARY_*` env vars because api config `requireEnv()`s them at boot; web `webServer` timeout 90s → 120s for slow CI cold starts; fixed `seed.ts` TS2591-class editor errors with a dedicated `apps/api/prisma/tsconfig.json` (standalone, `types: ["node"]` — not covered by the api config's `src/**/*` include) and `typecheck` now covers the prisma project

---

## Architecture

```
Browser → Next.js → Express API → PostgreSQL
                             ↘ Cloudinary
```

Authentication: JWT Bearer token in Authorization header, auto-refresh on 401.

Event flow: Submit → PENDING_REVIEW → Admin approves → APPROVED → Public.

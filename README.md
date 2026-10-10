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
- [x] Phase 33: SEO P3+P4 — JSON-LD structured data (Organization + WebSite with SearchAction in root layout; BreadcrumbList on all public pages; ItemList on list pages; Event on detail pages) via shared `lib/seo.ts` builders + `JsonLdScript` component, and sitemap pagination (fetches all pages of events/organizers up to 20×100, includes directory routes `/dastarkhwan` `/imambargahs` `/places` `/darbars`)

---

## Architecture

```
Browser → Next.js → Express API → PostgreSQL
                             ↘ Cloudinary
```

Authentication: JWT Bearer token in Authorization header, auto-refresh on 401.

Event flow: Submit → PENDING_REVIEW → Admin approves → APPROVED → Public.

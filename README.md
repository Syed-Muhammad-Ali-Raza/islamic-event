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

---

## Architecture

```
Browser → Next.js → Express API → PostgreSQL
                             ↘ Cloudinary
```

Authentication: JWT Bearer token in Authorization header, auto-refresh on 401.

Event flow: Submit → PENDING_REVIEW → Admin approves → APPROVED → Public.

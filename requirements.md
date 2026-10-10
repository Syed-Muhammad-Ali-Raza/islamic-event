# Requirements — Community Events Platform

Last updated: 2026-10-10 · Status: Phases 1–31 delivered (see `README.md` phase checklist).

## 1. Overview

A Pakistan-focused community events platform where organizers publish events, users discover and RSVP to them, and admins moderate content. Alongside events, the platform hosts curated community directories (free food, sacred sites, shrines, Urs calendar, Muharram processions, charities).

**Non-goals:** payments/ ticketing, mobile apps (web only), multi-tenant organizations.

## 2. Personas

| Persona | Needs |
|---|---|
| Visitor | Browse/search events, calendar/map views, save, share — no account required for browsing |
| User | Register (email verification), RSVP (Interested/Attending), profile, saved events |
| Organizer | Create/edit events (multi-step form), manage RSVPs, export attendees, QR check-in |
| Admin | Moderate events (approve/reject), manage categories & reports, view stats |

## 3. Functional requirements

### 3.1 Auth & accounts (Phases 2, 12, 13, 29)
- **FR-A1** Register/login with email + password (bcrypt, JWT access + refresh), RBAC: `USER | ORGANIZER | ADMIN`.
- **FR-A2** Email verification and password-reset flows (email provider with file-based fallback in dev).
- **FR-A3** Profile: edit name/phone; change password (notifies the user's in-app feed).
- **FR-A4** Account lockout: 5 failed logins in 15 min → `429 ACCOUNT_LOCKED` (counters reset on success; ghost emails never lock).

### 3.2 Events (Phases 4, 6, 9, 14, 16, 18, 19)
- **FR-E1** CRUD events with slug, category, organizer, status (`DRAFT → PENDING_REVIEW → APPROVED`), date range, venue + coordinates, images (Cloudinary, allow-list jpeg/png/webp, 10 MB).
- **FR-E2** Search + filter (category, city, date range, keyword), pagination; case-insensitive `q`.
- **FR-E3** Views: list, **calendar** month grid, **map** (Leaflet markers from coordinates) — one toggle control.
- **FR-E4** Share: WhatsApp / X / Facebook, copy-link, QR code on event detail.
- **FR-E5** Organizer detail pages (`/organizers/[slug]`) with SEO metadata; multi-step create form with validation.
- **FR-E6** Saved events (user's shortlist).

### 3.3 RSVPs & attendance (Phases 17, 20–23)
- **FR-R1** RSVP toggles (Interested / Attending) with counts on event detail; upsert semantics.
- **FR-R2** Organizer/admin RSVP dashboard per event; attendees panel on My Events.
- **FR-R3** CSV export of attendees (includes check-in column).
- **FR-R4** Email notifications: organizer notified of new RSVPs; hourly sweep sends 24 h reminders to attendees.
- **FR-R5** Per-attendee QR pass; organizer check-in via camera or pasted code, with undo.

### 3.4 Moderation & admin (Phases 8, 15, 11)
- **FR-M1** Admin dashboard: stats, event moderation (approve/reject with email), reports queue.
- **FR-M2** Category management: create/edit/activate-deactivate via admin UI + admin list API.
- **FR-M3** CI: GitHub Actions runs API + web test suites.

### 3.5 Directories & community data (Phases 24–31) — all public, read-only, seed-driven
| Data | Seed | API | UI |
|---|---|---|---|
| Free dastarkhwan points | 42 | `GET /dastarkhwans` (city, q) | `/dastarkhwan` city tabs |
| Imambargahs | 43 | `GET /imambargahs` (city, q) | `/imambargahs` + confidence badges |
| Pakistan places | 71 | `GET /places` (category, province, city, q) | `/places` + UNESCO badges |
| Darbars / shrines | 34 | `GET /darbars` (province, q) | `/darbars` + **Urs Calendar tab** |
| Urs dates | 36 (16 researched) | `GET /urs-dates` (researched, city, q) | ordered "Upcoming Urs" + `/categories/urs` |
| Muharram processions | 32 | `GET /processions` (city, month, day, kind, q) | jaloos routes on `/categories/muharram` |
| Charities | 29 | `GET /charities` (country/province/city, `policy=100`, q) + `/facets` | cascading country→province→city dropdowns on `/categories/charity` |

- **FR-D1** All directory rows follow the `sourceId`-unique, `isActive` model and are seeded **idempotently** (`upsert` with `update: {}`) from `apps/api/prisma/data/*.json`.
- **FR-D2** Category-conditional sections render only on their category page (muharram → Jaloos, charity → CharityDirectory, urs → UpcomingUrs).
- **FR-D3** Human-readable disclaimers on advisory data (routes/dates may change; verify donation policies).

### 3.6 Notifications & email (Phase 12)
- **FR-N1** In-app notifications (event approved/rejected/cancelled, new event, system) + email templates for verification, reset, moderation, RSVP, reminders.

### 3.7 Localization, SEO, performance (Phases 10)
- **FR-L1** 4 locales: `en`, `ur`, `hi`, `ar` — exact key parity enforced by test; RTL-aware layout.
- **FR-L2** SEO: metadata, sitemaps, OG/Twitter cards, JSON-LD for events; performance budgets.

## 4. Non-functional requirements

| Area | Requirement |
|---|---|
| Security | helmet, CORS allow-list, rate limiting, zod validation everywhere, JWT, account lockout, CSRF origin guard (state-changing verbs), `trust proxy` in prod, Next.js security headers (Referrer-Policy, Permissions-Policy), upload allow-list |
| Testing | API: jest + supertest (~144 tests); web: vitest (incl. i18n parity); single-suite runs via `npx jest tests/<file>.test.ts` from `apps/api` |
| Data integrity | Idempotent seeds, `unique()`-suffixed fixtures in tests (shared test DB), zod 422 contract |
| Perf | Server components + `fetchPaginated` with revalidate, TanStack Query staleTime 60 s client-side |
| Known gaps | Cloudinary creds are placeholders (uploads fail); no E2E suite |

## 5. Out of scope / backlog candidates

- Real Cloudinary (or S3) image pipeline
- E2E (Playwright) + visual regression
- SMS/WhatsApp notifications, maps geocoding
- i18n for directory pages (currently English-only UI strings)

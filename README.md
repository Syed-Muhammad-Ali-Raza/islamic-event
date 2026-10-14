# Community Events Platform

A modern web platform for Pakistani, Indian, and South Asian communities to discover, publish, manage, and share religious and community events.

**Event types:** Majlis · Milad · Mehfil-e-Naat · Dars · Quran Khwani · Jashan · Urs · Seerat-un-Nabi · Muharram · Ramadan · Iftar · Charity · Community · Educational · Other

---

## Features

**Events**
- Create events with a multi-step form, image upload, and map pin
- Admin moderation flow: Submit → Pending review → Approved → Public
- Search, filters, list / calendar / map views
- RSVPs (Interested / Attending), attendee CSV export, QR check-in
- Share via WhatsApp, X, Facebook, copy link, or QR code
- Email notifications and 24-hour event reminders

**Directories**
- Free Dastarkhwan (free food points)
- Imambargahs / Karbalas
- Darbars / Shrines with an Urs calendar
- Pakistan Places, Melas & Festivals (including the Punjab Auqaf Urs calendar)
- Scholars (Shia & Sunni) with sect and role filters
- Charity organizations with 100%-policy badges
- Muharram jaloos (procession) routes and road closures
- City hubs showing events and directories on one map

**Platform**
- Auth with JWT (access + refresh), role-based access, account lockout, CSRF guard
- User profiles, saved events, in-app notifications, organizer pages
- Admin dashboard (events, categories)
- Multilingual UI: English, Urdu, Hindi, Arabic
- SEO: server-rendered pages, JSON-LD, sitemap, canonical URLs
- Tests (Jest, Vitest, Playwright) and CI via GitHub Actions

> Some directory data (e.g. Urs dates, jaloos routes) is marked unverified and can change yearly. Always confirm with the organizers. See [Contributing](#contributing) to help correct data.

---

## Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS |
| State    | TanStack Query, Zustand                        |
| Forms    | React Hook Form + Zod                          |
| Backend  | Node.js, Express, TypeScript                   |
| Database | PostgreSQL + Prisma ORM                        |
| Storage  | Cloudinary                                     |
| Auth     | JWT (access + refresh), bcrypt                 |

```
Browser → Next.js → Express API → PostgreSQL
                             ↘ Cloudinary
```

```
community-events/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend (src/modules/*/<name>.routes.ts)
├── packages/
│   └── shared/       # Shared TypeScript types
├── e2e/              # Playwright end-to-end suite
├── docs/             # Development phases, screenshots
├── .env.example
└── package.json
```

---

## Getting Started

**Prerequisites:** Node.js >= 20, PostgreSQL, a Cloudinary account (uploads fail without real credentials).

```bash
# 1. Environment — two copies: the API server walks up to the repo root,
#    but the Prisma CLI and seed only read apps/api/.env
cp .env.example .env
cp .env.example apps/api/.env
# Fill in DATABASE_URL, JWT secrets, and Cloudinary credentials

# 2. Install
npm install

# 3. Database (from the repo root)
npm run db:generate --workspace apps/api   # Generate Prisma client
npm run db:push --workspace apps/api       # Apply schema (this repo uses db:push, not migrations)
npm run db:seed --workspace apps/api       # Seed categories, directories, admin user

# 4. Run (from the repo root, in two terminals)
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

Tests: `npm test` (unit) · `npm run test:e2e` (Playwright)

---

## Default Admin Account

Created by the seed (unless an account with that email already exists):

- Email: `admin@communityevents.pk`
- Password: `Admin@123456`

> **Change this password immediately in production.**

---

## API Overview

Base path: `/api/v1`

| Area   | Endpoints                                                                 |
| ------ | ------------------------------------------------------------------------- |
| Auth   | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Events | `GET /events`, `GET /events/:slug`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id` |
| Admin  | `GET /admin/dashboard`, `PATCH /admin/events/:id/approve`, `PATCH /admin/events/:id/reject` |

Directory endpoints (cities, scholars, melas, charities, processions, and others) follow the same pattern. Route files live in `apps/api/src/modules/<name>/<name>.routes.ts` and are mounted in `apps/api/src/app.ts`.

---

## Environment Variables

See `.env.example` for all required variables (`DATABASE_URL`, JWT secrets, `CLOUDINARY_*`, SMTP, CORS).

---

## Contributing

Contributions are welcome, including data corrections, translations, and bug fixes.

1. Fork the repo and create a branch: `git checkout -b fix/short-description`
2. Follow the setup steps above and make your change
3. Run the tests: `npm test`
4. Open a pull request describing what you changed and why

Starter tasks are listed in [`docs/good-first-issues.md`](docs/good-first-issues.md) — open them on GitHub with the [`good first issue` label](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

**Data corrections:** if you spot a wrong date, route, or location, open an issue with a source (organizer announcement, official calendar, etc.).

Please be respectful. This platform serves religious communities, so keep discussions courteous and on topic.

---

## Development Phases

The full delivered-phase checklist (1–43) lives in [`docs/PHASES.md`](docs/PHASES.md).

---

## Sponsor

If this project helps you, consider sponsoring: [github.com/sponsors/Syed-Muhammad-Ali-Raza](https://github.com/sponsors/Syed-Muhammad-Ali-Raza) (or use the **Sponsor** button at the top of the repo).

---

## License

[MIT](LICENSE) © 2026 Syed Muhammad Ali Raza

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

## Screenshots

_Coming soon — homepage, events list (map view), and event detail (desktop + mobile). Add images under `docs/screenshots/` and link them here._

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
npm run db:push --workspace apps/api       # Apply schema (dev fast path; migrations are also committed)
npm run db:seed --workspace apps/api       # Seed categories, directories, super admin (needs SEED_SUPER_ADMIN_PASSWORD)

# 4. Run (from the repo root, in two terminals)
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

Tests: `npm test` (unit) · `npm run test:e2e` (Playwright)

---

## Docker

Run the whole stack (PostgreSQL + API + web) with Docker Compose:

```bash
docker compose up --build
# web  → http://localhost:3000
# api  → http://localhost:4000/health
# db   → localhost:5432
```

- **Config comes from `.env`** (see `.env.example`). The API container runs with `NODE_ENV=production`, so `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` must be real random values (≥ 32 chars, not `your-*` placeholders) — generate with `openssl rand -hex 32`. The API refuses to start otherwise.
- **Schema:** migrations are committed under `apps/api/prisma/migrations/`. The API container still syncs with `prisma db push` on startup (dev fast path); real deployments should use `prisma migrate deploy` — see [Upgrading existing deployments](#upgrading-existing-deployments). `db push` never drops data without `--accept-data-loss`.
- **Seeding** runs from the host (the API image ships no dev tooling):

  ```bash
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/community_events" \
    npm run db:seed --workspace apps/api
  ```

- **Port clashes?** If you already run PostgreSQL locally, change `POSTGRES_PORT` (e.g. `55432`), `API_PORT`, or `WEB_PORT` in `.env` — Compose picks them up.

---

## Seeded Super Admin Account

The seed creates one **SUPER_ADMIN** account. Credentials come **only** from the environment — there is deliberately no default password. Set them in `apps/api/.env` **before** running `db:seed`:

```bash
SEED_SUPER_ADMIN_EMAIL="admin@communityevents.pk"   # optional — this is the default email
SEED_SUPER_ADMIN_PASSWORD="your-strong-password"    # required (12+ chars enforced in production)
```

- **Required:** the seed refuses to create the super admin unless `SEED_SUPER_ADMIN_PASSWORD` is set. There is no hardcoded fallback password.
- **Production** (`NODE_ENV=production`): `SEED_SUPER_ADMIN_PASSWORD` must be at least 12 characters.
- Re-running the seed **never overwrites** an existing user's password; if the account exists it is left untouched (and promoted to SUPER_ADMIN if it somehow is not).

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

## Deployment

Recommended production setup:

| Piece | Recommended | Notes |
| --- | --- | --- |
| Web | **Vercel** (Next.js) | Set every `NEXT_PUBLIC_*` var in project settings — they are inlined at build time |
| API | **Render** or **Railway** (Docker works out of the box) | Expose port `4000`; health check path `/health` |
| Database | **Neon** or **Supabase** (managed Postgres) | Use the pooled connection string; backups on by default |
| Images | **Cloudinary** | Required for event image uploads |

**Required environment variables (API):** `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (random, ≥ 32 chars — `openssl rand -hex 32`), `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `CORS_ORIGINS` (your web origin), `APP_URL`. **Web:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`. The API validates these at boot and refuses weak/placeholder JWT secrets in production.

**Migrate & seed:**

```bash
# Schema — recommended for real deployments (migrations are committed):
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
# ...or keep the dev/CI fast path (see .github/workflows/deploy.yml):
npx prisma db push --skip-generate

# Seed (once per environment, from a machine with dev deps installed):
SEED_SUPER_ADMIN_PASSWORD="your-strong-password" npm run db:seed --workspace apps/api

# Super admin account: set SEED_SUPER_ADMIN_PASSWORD (and optionally
# SEED_SUPER_ADMIN_EMAIL) in the environment before seeding —
# see "Seeded Super Admin Account" above.
```

**Post-deploy checklist:**

- [ ] `GET https://api.<your-domain>/health` returns `"status":"ok"` and `"database":"up"`
- [ ] Real JWT secrets set (not `your-*` placeholders) — the API log shows no config errors
- [ ] `CORS_ORIGINS` contains the exact production web origin(s)
- [ ] Web build has the production `NEXT_PUBLIC_API_URL` (inlined at build time)
- [ ] Admin seeded and the initial password changed
- [ ] Cloudinary upload tested with a real image
- [ ] HTTPS enforced by the host; custom domain + DNS verified

---

## Upgrading existing deployments

Migrations are committed under `apps/api/prisma/migrations/` and ordered lexicographically:

1. `0_init` — baseline of the pre-migration schema (existing databases mark it applied with `npx prisma migrate resolve --applied 0_init --schema apps/api/prisma/schema.prisma`)
2. `20261015081210_add_super_admin_role` — `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'` (kept separate: Postgres cannot *use* a new enum value in the transaction that adds it)
3. `20261015081219_org_approval_system` — new enums `OrgRole`/`ApprovalStatus`, `organization_members` table, approval columns on the 9 directory tables
4. `20261015081220_promote_admins_to_super_admin` — data-only `UPDATE users SET role='SUPER_ADMIN' WHERE role='ADMIN'` (the legacy `ADMIN` value stays in the enum and is still treated as super admin by the code)

To upgrade an existing database:

```bash
npx prisma migrate resolve --applied 0_init --schema apps/api/prisma/schema.prisma  # once, on pre-migration DBs
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

All existing rows keep working: directory entries get `approvalStatus = 'APPROVED'` (default), and admins become `SUPER_ADMIN`.

**⚠️ Rotate the legacy default admin.** Older seeds shipped a public default account (`admin@communityevents.pk` / `Admin@123456`, visible in git history), and this upgrade promotes that account to SUPER_ADMIN if it still exists. After upgrading, either deactivate it or rotate its password by hand using the commented runbook in [`apps/api/prisma/ops/rotate-default-admin.sql`](apps/api/prisma/ops/rotate-default-admin.sql) (never run automatically — it lives outside `prisma/migrations/` for that reason). See also `SECURITY_NOTES.md`.

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

## Content Disclaimer

Urs dates, Muharram procession routes, road closures, darbar/shrine details, charity information, and other directory entries are **curated from publicly available sources** and may change without notice — dates shift (moon sighting), routes are altered by local authorities, and organizations update their policies. Nothing here should be treated as an official announcement.

Always confirm with the organizers, the relevant Auqaf department, or the shrine administration before travelling.

**Found something wrong?** [Open an issue](../../issues/new) with a source link, or use the "Data corrections" notes in [Contributing](#contributing) — corrections are the most valuable contributions you can make.

---

## Sponsor

If this project helps you, consider sponsoring: [github.com/sponsors/Syed-Muhammad-Ali-Raza](https://github.com/sponsors/Syed-Muhammad-Ali-Raza) (or use the **Sponsor** button at the top of the repo).

---

## License

[MIT](LICENSE) © 2026 Syed Muhammad Ali Raza

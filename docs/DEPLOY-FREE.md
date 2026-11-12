# Deploy for free — Vercel (web) + Vercel (API) + Neon

A complete, $0/month deployment of this monorepo. No credit card, no server to
patch: both apps run on Vercel Hobby and the database is Neon's free plan.

```
Browser ──► Vercel (Next.js web) ──► Vercel serverless fn (Express API) ──► Neon Postgres
                  │                             │
                  └── Neon Object Storage       └── Gmail SMTP / Brevo (email)
```

| Piece | Service | Free tier | Notes |
| --- | --- | --- | --- |
| Web | Vercel Hobby | 100 GB bandwidth | Next.js preset, root dir `apps/web` |
| API | Vercel Hobby (serverless function) | 100 GB-hours, 1M invocations | Cold start 1–3 s; 30 s max duration |
| Database | Neon free | 1 GB storage, 100 CU-hours | Permanent (no 30-day expiry), scales to zero |
| Images | Neon Object Storage | 5 GB per project | S3-compatible, branches with the DB, `public_read` bucket — §4 |
| Email | Gmail SMTP or Brevo API | 500/day (Gmail) · 300/day (Brevo) | Gmail needs no domain; Brevo needs a verified sender — §5d |

> Free tiers are for demos and small communities, not an SLA. Moving to paid
> plans later requires no code change.

**Why both apps on Vercel?** Render now demands a card on file before it will
create *any* service — including the free plan (`POST /services` → `402 Payment
information is required`). Vercel's Hobby tier has no such gate, and one vendor
means one deploy flow. The Render blueprint (`render.yaml`) and Dockerfile are
kept in the repo for anyone who does add a card.

---

## 1. Read this first: what serverless changes

The Express API runs unchanged inside one Vercel function. Three consequences:

| Limitation | Impact | Mitigation |
| --- | --- | --- |
| The process is not long-lived | The hourly RSVP-reminder sweep (`setInterval` in `server.ts`) never runs | Vercel Cron calls `GET /api/v1/internal/reminders` once a day on Hobby (§5e); use an external cron for hourly runs |
| 30 s request cap (`maxDuration` in `vercel.json`) | Long report/export queries could time out | Already capped by pagination; raise to 60 s if needed |
| No writable disk | The dev email outbox used to write `logs/outbox/` | `outboxDir()` now falls back to the OS temp dir — emails are still not *delivered* without Brevo/SMTP, just logged |
| Cold starts | First request after idle takes ~1–3 s (plus Neon wake ~0.5 s) | Acceptable; a free monitor pinging `/health` every 10 min keeps it warm |

Everything else behaves exactly like the long-running server: CORS, rate
limiting, helmet, zod validation, JWT auth, Prisma.

---

## 2. Before you start

- Repo pushed to GitHub (`origin` already points at
  `https://github.com/Syed-Muhammad-Ali-Raza/islamic-event.git`).
- Accounts: [Neon](https://neon.com) (database + object storage),
  [Vercel](https://vercel.com), optionally [Brevo](https://brevo.com) for a
  branded sending domain. Cloudinary is no longer needed.
- Vercel CLI: `npx vercel login` (or run `vercel` once and follow the device
  link). GitHub auto-connect is **not** required — CLI deploys work without it.
- Two random JWT secrets:

  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## 3. Step 1 — Neon Postgres

1. Neon Console → **New Project**.
   - Name: `community-events`
   - Region: anything close to your users; the API will run from Vercel's
     default function region, so pick the region closest to it (this deployment
     uses `aws-us-east-2`).
2. Open **Connect** and copy **both** connection strings:

   ```ini
   DATABASE_URL="postgresql://user:pass@ep-x-pooler.<region>.aws.neon.tech/neondb?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-x.<region>.aws.neon.tech/neondb?sslmode=require"
   ```

   - **Pooled** (`-pooler`) → `DATABASE_URL`, used by the function. Add
     `&pgbouncer=true&connection_limit=1` for Prisma behind PgBouncer.
   - **Direct** (no `-pooler`) → `DATABASE_URL_UNPOOLED`, used by the Prisma CLI
     (`db push` / `migrate`).

3. Keep both strings — they go into Vercel in §5 and §7.

> Neon scales to zero after ~5 minutes idle. The first query afterwards takes
> ~0.5–1 s. Expected and harmless.

---

## 4. Step 2 — Image storage (Neon Object Storage, or Cloudinary)

Poster uploads need an S3-compatible bucket. The zero-extra-account option is
**Neon Object Storage**, which lives in the same project as the database, is
included in the Free plan (5 GB), and branches with it.

1. In the Neon console open the project → **Storage** (or use `neon bucket create
   event-posters --access public_read`).
2. Create a bucket named `event-posters` with **public read** access.
3. Create a **storage credential** for the production branch (scopes
   `storage:read`, `storage:write`). It returns a token id and secret.
4. Add these to the API's env vars (§5b):

   ```
   S3_ENDPOINT_URL=https://<branch-endpoint>.storage.<region>.aws.neon.tech
   S3_REGION=us-east-2
   S3_BUCKET=event-posters
   S3_ACCESS_KEY_ID=<credential token id>
   S3_SECRET_ACCESS_KEY=<credential secret>
   ```

   AWS-standard names (`AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`) work too — the code prefers the `S3_*` spelling.

The public URL shape is `<S3_ENDPOINT_URL>/<S3_BUCKET>/<key>`, which is exactly
what the API returns. Set `S3_PUBLIC_BASE_URL` if you later put a CDN or custom
domain in front of the bucket.

Uploads are re-encoded to WebP at ≤1600 px (EXIF rotation honoured) so a 6 MB
phone photo lands as ~150–250 KB; keys are immutable and served with
`Cache-Control: public, max-age=31536000, immutable`.

The web app renders posters with `next/image`, so the bucket host must be
allow-listed — `apps/web/next.config.js` includes the production branch endpoint
and accepts a comma-separated `NEXT_PUBLIC_IMAGE_HOSTS` override (needed for
preview branches, which get their own storage endpoint).

**Fallback: Cloudinary.** If `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`
are real values, Cloudinary is used when no `S3_*` set is present. Placeholders
(`your-*`, `placeholder-*`) are ignored. With **neither** backend configured the
API still boots, logs `[storage] No image storage configured`, and uploads return
`503 IMAGE_STORAGE_UNAVAILABLE` instead of a mystery 500.

---

## 5. Step 3 — API on Vercel

### 5a. What makes the API serverless

| File | Purpose |
| --- | --- |
| `apps/api/api/index.ts` | `export default app` — the whole Express app is one function |
| `apps/api/vercel.json` | rewrites `/(.*)` → `/api`; `buildCommand` = `npm run vercel-build`; `outputDirectory` = `public`; `maxDuration` 30 s |
| `apps/api/package.json` | `"vercel-build": "prisma generate"` — generates the Linux (rhel-openssl-3.0.x) query engine during the build |
| `apps/api/prisma/schema.prisma` | `binaryTargets = ["native", "rhel-openssl-3.0.x"]` |
| `apps/api/public/robots.txt` | makes `outputDirectory` real so Vercel never publishes `src/` as static files |

`public/` exists only because of `outputDirectory`: if it is missing, Vercel falls
back to publishing the whole `apps/api` directory, and source files have no
business being served as static assets. The robots file is a crawler block and
nothing else — the API has no content to index.

### 5b. Create the project and set the env vars (CLI)

```powershell
cd C:\Users\Ali\Desktop\islamic-event\apps\api
npx vercel link --project islamic-event-api          # creates the project
npx vercel project update islamic-event-api --framework other --root-directory apps/api
```

Then add these in **Project → Settings → Environment Variables** (Production +
Preview). `NODE_ENV` is injected by Vercel — do not set it.

| Key | Value |
| --- | --- |
| `API_PREFIX` | `/api/v1` |
| `DATABASE_URL` | Neon **pooled** URL + `&pgbouncer=true&connection_limit=1` |
| `DATABASE_URL_UNPOOLED` | Neon **direct** URL |
| `JWT_ACCESS_SECRET` | 64-char hex (production rejects placeholders / <32 chars) |
| `JWT_REFRESH_SECRET` | different 64-char hex |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `S3_ENDPOINT_URL` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | image uploads — see §4 |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | optional fallback only (§4) |
| `CORS_ORIGINS` | the web URL, e.g. `https://islamic-event-web.vercel.app` |
| `APP_URL` | same web URL (used in email links) |
| `SUPPORT_EMAIL` | your support mailbox |
| `BREVO_API_KEY` + `EMAIL_FROM` | email delivery — see §5d |
| `SMTP_*` | alternative to Brevo — see §5d |
| `CRON_SECRET` | optional — enables the daily reminder cron (§5e) |

### 5c. Deploy

Deploys must be run from the **repo root** so the workspace install can resolve
every package. `--archive=tgz` is required on Hobby: uploading thousands of
individual files trips the `api-upload-free` quota.

```powershell
# .vercel/project.json must point at the API project (the CLI writes it in 5b;
# copy apps/api/.vercel/project.json to the repo-root .vercel/ if needed)
npx vercel deploy --prod --yes --archive=tgz
```

First build takes ~2–4 minutes (`npm ci` for the monorepo + `prisma generate`).

### 5d. Email

Delivery order: **Brevo HTTP API → SMTP relay → dev outbox**.

**Choosing a sender**

| Situation | Use | Deliverability |
| --- | --- | --- |
| No domain (most demos) | **Gmail SMTP + App Password** | Good — Google signs as `gmail.com` |
| Domain you control | Brevo with the domain authenticated (DKIM/SPF) | Best — branded `no-reply@…` |
| Gmail address sent *through Brevo* | Brevo, verified single sender | Poor — From domain ≠ signing domain, often spam |

**Gmail SMTP — no domain needed, 500 recipients/day, $0**

1. Google Account → **Security** → turn on **2-Step Verification**.
2. Same page → **App passwords** → create one named "Community Events API"
   (16 characters, shown in groups of four).
3. One command — writes the env, authenticates, sends a test, pushes to Vercel:

   ```powershell
   npm run smtp:setup:push --workspace apps/api -- `
     gmail you@gmail.com "<app-password>" you@gmail.com `
     --to you@gmail.com
   ```

   Success looks like:

   ```
   PASS  TLS connection + authentication
   PASS  Message accepted (id <…>) — check you@gmail.com
   PASS  Pushed SMTP_PASS to Vercel Production.
   ```

   The `:push` variant needs a logged-in Vercel CLI. `npm run smtp:setup` (no
   `:push`) only writes `apps/api/.env`, verifies the login and prints the
   `vercel env add` lines. Use `:push` because npm swallows `--push` when it is
   passed through `npm run`.
4. Redeploy: `npx vercel deploy --prod --archive=tgz`.

Gmail always sends as the authenticated account (or a verified "Send mail as"
alias), so `EMAIL_FROM` must be that same address. Use a dedicated account
(e.g. `communityevents.pk@gmail.com`) if you don't want the app sending from
your personal inbox. Heads-up: Google occasionally flags automated traffic from
cloud IPs; if that happens, switch to Brevo with your own domain.

**Brevo HTTP API — best once you own a domain (300 emails/day, no card):**

1. Create a free account at <https://app.brevo.com/>.
2. **Senders & IP → Senders** → add and verify the address you will send from.
   With a domain, also authenticate it (DKIM/SPF) under **Domains**.
3. **SMTP & API → API Keys** → create a v3 key.
4. Save, validate and push to Vercel in one command (writes `BREVO_API_KEY`
   and `EMAIL_FROM` into `apps/api/.env`, checks the key + sender against
   Brevo, then updates the API project's Production env vars):

   ```powershell
   npm run brevo:check:push --workspace apps/api -- <BREVO_API_KEY> you@example.com
   ```

   Success looks like:

   ```
   PASS  Account: you@example.com (…) plan=free
   PASS  Sender verified: you@example.com
   PASS  Pushed BREVO_API_KEY to Vercel Production.
   PASS  Pushed EMAIL_FROM to Vercel Production.
   ```

5. Redeploy so the new env vars take effect:

   ```powershell
   npx vercel deploy --prod --archive=tgz
   ```

**Brevo over SMTP (SMTP key instead of an API key):**

```powershell
npm run smtp:setup:push --workspace apps/api -- `
  brevo c20fba001@smtp-brevo.com <SMTP_KEY> you@example.com
```

It writes `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`,
`SMTP_SECURE=false`, `SMTP_USER/SMTP_PASS`, then opens a real STARTTLS
connection, authenticates, and updates Production (the `:push` script variant).
The SMTP key starts with `xsmtpsib-`; the API key (`xkeysib-`) does not work
over SMTP.

**Any other relay** — same command with `host:port`:

```powershell
npm run smtp:setup:push --workspace apps/api -- smtp.example.com:587 user pass from@example.com
```

Verify delivery from your machine (reads `apps/api/.env`) or from a shell with
the production env vars:

```powershell
npm run email:test --workspace apps/api -- you@example.com
```

With neither `BREVO_API_KEY` nor a complete `SMTP_*` set (`host` + `user` +
`pass`), emails are **not delivered** — the API logs
`[email] No email transport configured … was NOT sent` at boot and on each
attempt, and writes HTML to `/tmp/outbox`. A half-filled SMTP config (password
missing) falls back to the outbox with a warning instead of failing every send.

### 5e. Reminder cron (Vercel)

`vercel.json` schedules one daily call to `GET /api/v1/internal/reminders`.
Vercel attaches `Authorization: Bearer <CRON_SECRET>` automatically when the
`CRON_SECRET` env var exists on the project:

```powershell
$secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$secret | npx vercel env add CRON_SECRET production
```

Without `CRON_SECRET` the endpoint answers `503`; with a wrong/missing bearer
token it answers `401`. Vercel Hobby runs crons **once per day** (schedule
`0 4 * * *` = 09:00 PKT), so the "24 hours before" reminder window is checked
daily rather than hourly. For hourly runs, point a free external cron
(cron-job.org) at the same URL with the same bearer header.

### 5f. Confirm the API is alive

```powershell
& curl.exe -s https://islamic-event-api.vercel.app/health
# {"status":"ok","database":"up","uptime":51,"timestamp":"…","env":"production"}
```

---

## 6. Step 4 — Web on Vercel

1. Vercel → **Add New → Project** → import the same repo.
2. **Root Directory:** `apps/web`. Framework preset **Next.js**; leave
   build/output at defaults.
3. Add env vars **before** the first build (`NEXT_PUBLIC_*` is inlined at build
   time):

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://islamic-event-api.vercel.app/api/v1` |
   | `NEXT_PUBLIC_APP_URL` | `https://islamic-event-web.vercel.app` |
   | `NEXT_PUBLIC_APP_NAME` | `Community Events` |

4. **Deploy**, then set `CORS_ORIGINS` + `APP_URL` on the API project to the URL
   Vercel assigned, and redeploy the API if you had to change them. Without a
   matching `CORS_ORIGINS` the browser blocks every API call.

> Vercel's default deployment protection can sit in front of a project. The
> production alias of a Hobby project is public by default; if you see a login
> wall, disable **Deployment Protection** for that project.

---

## 7. Step 5 — Create the schema and seed the data

Both are one-off tasks run **from your machine** against Neon — Vercel functions
never run `db push`, and seeding needs dev dependencies (`tsx`, `bcrypt`, JSON
datasets). The seed is idempotent; re-running is safe.

```powershell
cd C:\Users\Ali\Desktop\islamic-event

# Point at Neon for this shell session only (apps/api/.env keeps localhost).
$env:DATABASE_URL = "postgresql://...-pooler...neon.tech/neondb?sslmode=require"
$env:DATABASE_URL_UNPOOLED = "postgresql://...neon.tech/neondb?sslmode=require"

npx prisma db push --schema apps/api/prisma/schema.prisma

$env:SEED_SUPER_ADMIN_EMAIL = "you@example.com"
$env:SEED_SUPER_ADMIN_PASSWORD = "a-strong-password-12+"
npm run db:seed --workspace apps/api
```

Verify in the Neon SQL editor:

```sql
select count(*) from events where status = 'APPROVED';   -- 42 (expos) + yours
select count(*) from categories;                          -- 16
select email, role from users where role = 'SUPER_ADMIN';
```

Log in at `https://islamic-event-web.vercel.app/login`.

> **Windows gotcha:** `npm` prints notices to stderr, so PowerShell may report
> exit code 1 even on success. Judge by the `[ok] … seeded` lines.

---

## 8. Environment variable reference

### API (Vercel)

| Variable | Required | Example / notes |
| --- | --- | --- |
| `NODE_ENV` | auto | Vercel sets `production`; do not define it yourself |
| `API_PREFIX` | no | `/api/v1` |
| `DATABASE_URL` | yes | Neon pooled URL + `&pgbouncer=true&connection_limit=1` |
| `DATABASE_URL_UNPOOLED` | yes | Neon direct URL — Prisma CLI uses it |
| `JWT_ACCESS_SECRET` | yes | ≥ 32 chars, not a placeholder, different from refresh |
| `JWT_REFRESH_SECRET` | yes | ≥ 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` |
| `S3_ENDPOINT_URL` | for uploads | Neon storage endpoint for the production branch — §4 |
| `S3_REGION` | for uploads | e.g. `us-east-2` |
| `S3_BUCKET` | for uploads | `event-posters` (public_read) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | for uploads | branch storage credential |
| `S3_PUBLIC_BASE_URL` | no | CDN/custom domain in front of the bucket |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | no | fallback image backend; placeholders ignored |
| `CORS_ORIGINS` | yes | web origin, comma-separated for more |
| `APP_URL` | yes | web URL — used in email links |
| `SUPPORT_EMAIL` | no | shown in email footers |
| `BREVO_API_KEY` | no | preferred email transport — §5d |
| `EMAIL_FROM` | no | sender address; must be verified in Brevo |
| `SMTP_HOST` / `PORT` / `SECURE` / `USER` / `PASS` | no | fallback when `BREVO_API_KEY` is empty; empty = emails logged, not sent |
| `CRON_SECRET` | no | bearer token for `GET /api/v1/internal/reminders`; empty disables it |
| `PORT` | no | ignored on Vercel |

### Web (Vercel)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | inlined at build — changing it needs a redeploy |
| `NEXT_PUBLIC_APP_URL` | yes | inlined at build (canonical/OG URLs, sitemap) |
| `NEXT_PUBLIC_APP_NAME` | no | defaults to `Community Events` |
| `NEXT_PUBLIC_IMAGE_HOSTS` | no | comma-separated extra `next/image` hosts (e.g. a preview branch's storage endpoint) |
| `API_INTERNAL_URL` | no | overrides the server-component fetch URL at runtime |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | no | Search Console HTML-tag token; emitted as `<meta name="google-site-verification">` |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | no | Bing Webmaster `msvalidate.01` token |

---

## 9. Post-deploy smoke test

- [ ] `GET https://<api>/health` → `"status":"ok"`, `"database":"up"`, `"env":"production"`
- [ ] `GET https://<api>/api/v1/categories` → 16 rows
- [ ] `GET https://<api>/api/v1/internal/reminders` → 401 without the bearer token
- [ ] `GET https://<api>/api/v1/events?category=expo&limit=3` → data
- [ ] Web `/` and `/darbars` render rows (not an empty shell)
- [ ] `/categories/expo` → 42 events; a detail page renders venue + map
- [ ] Login as the seeded super admin → `/admin` dashboard shows 42 events
- [ ] Create an event with a poster → upload returns `201`, the returned
      storage URL serves the image (`200 image/webp`), and the event page shows it
- [ ] `CORS_ORIGINS` matches the web origin exactly (no trailing slash)

---

## 10. Cold starts

Vercel scales functions to zero. The first request after idle costs ~1–3 s
(function boot + Prisma connect + Neon wake); subsequent requests are fast.

- **Do nothing** — fine for low traffic.
- **Ping `/health` every 10 minutes** with [cron-job.org](https://cron-job.org)
  or UptimeRobot to keep one instance warm and get uptime alerts.

Background jobs do not run on serverless; the only scheduled work is the daily
reminder cron in §5e (Hobby allows one run per day). Ping `/health` separately
if you want uptime alerts.

---

## 11. Updating the deployment

Auto-deploy on push requires connecting the GitHub repo to each Vercel project
(**Settings → Git**). When it is not connected, deploy from the CLI:

```powershell
git push origin main

# API (root .vercel/project.json → islamic-event-api)
npx vercel deploy --prod --yes --archive=tgz

# Web (root .vercel/project.json → islamic-event-web)
npx vercel deploy --prod --yes --archive=tgz
```

Both projects share the repo root, so keep the two `.vercel/project.json` files
handy and copy the right one to `.vercel/` before each deploy (the CLI writes
`apps/<app>/.vercel/project.json` when you `vercel link` from that directory).

Schema changes: edit `apps/api/prisma/schema.prisma`, then run
`npx prisma db push` against Neon (or commit migrations and run
`npx prisma migrate deploy`). Never run `migrate dev` against Neon — it is
interactive and can reset data.

---

## 12. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Function returns 500, log `PrismaClientInitializationError … could not locate the Query Engine` | `binaryTargets` missing `rhel-openssl-3.0.x`, or `prisma generate` did not run — check the build log for `vercel-build` |
| Boot fails: `Invalid environment configuration … CLOUDINARY_*` | Removed — Cloudinary is optional now; if you see this, the deployment is older than the §4 change |
| Uploads return `503 IMAGE_STORAGE_UNAVAILABLE` | No usable image backend: set the `S3_*` vars from §4 (or real `CLOUDINARY_*` values) and redeploy |
| Upload `201` but the image URL 404s | Bucket is not `public_read`, or `S3_PUBLIC_BASE_URL` points somewhere other than `<endpoint>/<bucket>` |
| `AccessDenied` / `SignatureDoesNotMatch` on upload | Wrong credential pair, or the credential was revoked/rotated — issue a new one and update `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` |
| Event page poster blank, optimizer 400 | Bucket host missing from `next/image` allow-list — set `NEXT_PUBLIC_IMAGE_HOSTS` and redeploy the **web** project |
| Upload `413 PAYLOAD_TOO_LARGE` | Poster exceeds 10 MB; the browser accepts JPG/PNG/WEBP only |
| Upload `400 INVALID_FILE_TYPE` | File extension and MIME type must both be JPG/PNG/WEBP |
| `JWT_ACCESS_SECRET must be at least 32 characters` | Use a real 64-char hex secret, not `your-…` |
| Browser console: blocked by CORS | `CORS_ORIGINS` must be the exact web origin, no trailing slash |
| `POST /api/v1/auth/login` → `429 ACCOUNT_LOCKED` | 5 failed logins in 15 min; wait or reset the counter in the DB |
| Any auth call → `429 RATE_LIMITED` | Per-IP limits (see `SECURITY_NOTES.md` §4): 10 failed logins, 12 sign-ups, 5 reset emails per 15 min, 60 total on `/auth`. Wait for the `RateLimit-Reset` window; counters are per API instance |
| Every page empty, `/health` 404 with `x-vercel-routing` | Wrong project or wrong alias — check `vercel ls` and the project's Domains |
| Vercel upload: `Too many requests … api-upload-free` | Add `--archive=tgz` |
| `No Output Directory named 'public' found` | `apps/api/public/` was deleted — restore `apps/api/public/robots.txt` |
| `[email] No email transport configured … NOT sent` | Set `BREVO_API_KEY` or the `SMTP_*` vars (§5d) |
| Brevo `401 Unauthorized` | Key wrong/revoked — recreate it in SMTP & API → API Keys |
| Brevo `400 … sender … not valid` | `EMAIL_FROM` must be a verified sender in Senders & IP → Senders |
| Gmail `535-5.7.8 Username and Password not accepted` | Use a 16-character App Password (2-Step Verification must be on), never the account password |
| Gmail `534-5.7.9 Application-specific password required` | Same fix: create an App Password |
| Email lands in spam | `From` domain must match the signing domain — Gmail SMTP for Gmail/Gmail, own domain on Brevo (§5d) |
| `P1001: Can't reach database server` | `DATABASE_URL` typo, or drop `?sslmode=require` |
| `P1001` only locally, `psql`/ping works | Broken IPv6 route: Neon's AAAA records are tried first. Disable IPv6 on the adapter, or append `&connect_timeout=150&pool_timeout=200` |
| `prisma generate` fails locally with `EPERM: rename … query_engine-windows.dll.node` | Antivirus/Defender holds the DLL just written. Retry, or add `node_modules\.prisma` to the AV exclusion list. (Does not affect CI or Vercel — they run on Linux.) |
| Vercel build error about files outside the project root | Web root directory must be `apps/web`; the custom `outputFileTracingRoot` is skipped on Vercel |
| Uploads fail with a Cloudinary error | Placeholder/invalid keys. Prefer Neon Object Storage (§4); Cloudinary is only the fallback |

---

## 13. Plan B — a long-running host

Serverless is the cheapest way in, but it cannot run background jobs. If you
need the hourly reminder sweep, a warm process, or a writable disk:

- **Oracle Cloud Always Free** (4 OCPU / 24 GB ARM VM, Ubuntu 22.04): open
  ingress for 80/443, install Docker, `docker compose up -d --build`, point a
  domain at the VM. No sleep, no SMTP restrictions, no cold starts — you patch
  the OS and terminate TLS yourself (Caddy or Nginx + Certbot).
- **Render** (`render.yaml` + `apps/api/Dockerfile` are kept for this): free
  plan, but Render now requires a payment method on file before creating any
  service, free or not.

The Vercel front end can keep talking to either over HTTPS — only
`NEXT_PUBLIC_API_URL` and `CORS_ORIGINS` change.

---

## 14. Cost summary

| Service | Monthly |
| --- | --- |
| Vercel Hobby (web) | $0 |
| Vercel Hobby (API function) | $0 |
| Neon free (Postgres + 5 GB object storage) | $0 |
| Email: Gmail SMTP (500/day) or Brevo free (300/day) | $0 |
| **Total** | **$0** |

---

## 15. Search discovery (Google, Bing, answer engines)

Everything crawler-facing is already generated by the app: `/robots.txt` (named
crawlers + AI agents, private routes closed), `/sitemap.xml` (static routes,
approved events, organizers, categories, cities with events, image entries for
event posters), `/llms.txt` (plain-text map for ChatGPT/Perplexity/Claude), and
JSON-LD (`Organization`, `WebSite` + `SearchAction`, `Event` with postal address
and geo coordinates, `BreadcrumbList`, `ItemList`).

What the code cannot do is tell Google the site exists. One-time manual steps:

1. **Search Console** → Add property → **URL prefix** `https://islamic-event-web.vercel.app/`.
   A *Domain* property needs a DNS TXT record, which is impossible on `*.vercel.app`;
   switch to a Domain property only after a custom domain is attached.
2. Choose the **HTML tag** method, copy the `content="..."` token, then:
   ```bash
   # web project (run from repo root; .vercel/project.json points at the web project)
   npx vercel env add NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION production
   # paste the token, then redeploy
   npx vercel deploy --prod --archive=tgz
   ```
3. Back in Search Console, click **Verify**.
4. **Sitemaps** → add `sitemap.xml` → Submit. Sitemap processing takes 1-3 days.
5. **URL Inspection** → request indexing for `/`, `/events` and 3-5 event pages
   (roughly 10 requests/day).
6. **Bing Webmaster Tools** (optional, feeds Copilot/ChatGPT search): same flow,
   token goes into `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
7. **Get one real backlink** (GitHub repo README, a Facebook/Instagram profile,
   a forum post). Crawl discovery is link-driven; this is the biggest accelerant.

Expect first pages in the index within 3-14 days. Verify with
`site:islamic-event-web.vercel.app` in Google, or the Coverage/Pages report.

When the custom domain arrives: add it in Vercel, update `NEXT_PUBLIC_APP_URL`
(canonical/OG/sitemap URLs are built from it), redeploy, then add a **Domain**
property in Search Console and re-submit the sitemap.

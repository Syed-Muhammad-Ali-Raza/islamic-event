# Deploy for free — Vercel + Render + Neon

A complete, $0/month deployment of this monorepo. No credit card is required for
any of the services below.

```
Browser ──► Vercel (Next.js web)  ──► Render (Express API, Docker)  ──► Neon (Postgres)
                    │                          │
                    └── Cloudinary (images)    └── Brevo (transactional email)
```

| Piece | Service | Free tier (Nov 2026) | Notes |
| --- | --- | --- | --- |
| Web | Vercel Hobby | 100 GB bandwidth | Personal / non-commercial use only |
| API | Render free web service (Docker) | 512 MB RAM, 750 instance-hours/month, 500 build-minutes | Sleeps after 15 min idle (~50 s cold start) |
| Database | Neon free | 1 GB storage, 100 CU-hours/month | Permanent (no 30-day expiry), scales to zero |
| Images | Cloudinary free | ~25 credits/month | Uploads are disabled until real keys are set |
| Email | Brevo free | 300 emails/day | **Required on Render — see §1** |

> Free tiers are for demos and small communities. They are not an SLA. For real
> traffic, move the API + DB to a paid plan; the code does not change.

---

## 1. Read this first: email on Render free

Render's free web services **block outbound SMTP on ports 25, 465 and 587**.
That means the Gmail app-password setup from local development
(`smtp.gmail.com:465`) **cannot send from a free Render API** — the connection
just times out.

Two ways out:

| Option | Cost | Email provider | Effort |
| --- | --- | --- | --- |
| **A (recommended)** | $0 | Brevo, port **2525** (not blocked) | 5 min signup, no code change |
| B | $0 | Gmail, ports 465/587 | Run the API on Oracle Cloud "Always Free" VM instead of Render (§13) |
| C | ~$7/mo | Gmail or anything | Render Starter plan removes the SMTP block |

Option A keeps the same `nodemailer` code — only the `SMTP_*` env vars change.
Brevo's relay host is `smtp-relay.brevo.com` and it accepts port `2525` with
STARTTLS (`SMTP_SECURE=false`).

---

## 2. Before you start

- Repo pushed to GitHub (`origin` already points at
  `https://github.com/Syed-Muhammad-Ali-Raza/islamic-event.git`).
- Accounts: [Neon](https://neon.com), [Render](https://render.com),
  [Vercel](https://vercel.com), [Cloudinary](https://cloudinary.com),
  [Brevo](https://brevo.com). Sign up with GitHub where possible.
- Two random JWT secrets. Generate once and keep them:

  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  (Render can also generate them for you via `render.yaml` — see §5.)

---

## 3. Step 1 — Neon Postgres

1. Neon Console → **New Project**.
   - Name: `community-events`
   - Region: **AWS ap-southeast-1 (Singapore)** — same region as the Render
     service, so queries stay fast.
   - Postgres version: default.
2. On the project dashboard, open **Connect** and copy **both** connection
   strings:

   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`, used by the running API.
   - **Direct** (no `-pooler`) → `DATABASE_URL_UNPOOLED`, used by the Prisma CLI
     (`db push` / migrations).

   ```ini
   DATABASE_URL="postgresql://neondb_owner:XXXX@ep-cool-name-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://neondb_owner:XXXX@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

   Use the direct host for the CLI, not the pooled one: this API is a single
   long-running process, and pooled connections are meant for serverless.
3. Keep both strings — they are `DATABASE_URL` / `DATABASE_URL_UNPOOLED` in two
   places (§5 and §7).

> Neon scales to zero after ~5 minutes idle. The first query afterwards takes
> ~0.5–1 s. That is expected and harmless.

---

## 4. Step 2 — Cloudinary (image uploads)

The API **refuses to boot in production** without `CLOUDINARY_*`, because the
config validation treats them as required.

1. Cloudinary Console → **Programmable Media → Dashboard**.
2. Copy **Cloud name**, **API Key**, **API Secret** (the secret needs
   *Generate new* if hidden).
3. Paste them into Render in §5.

Until these are real values, event image uploads return an error (seeded data
and all other features work fine).

---

## 5. Step 3 — Render API

### 5a. Deploy via the blueprint (recommended)

The repo ships `render.yaml`, which defines the Docker service, the free plan,
the health check and every env var.

1. Render Dashboard → **New → Blueprint**.
2. Pick this repository, branch `main`. Render reads `render.yaml`.
3. Render prompts for the vars marked `sync: false`:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** (`-pooler`) string from §3 |
   | `DATABASE_URL_UNPOOLED` | Neon **direct** string from §3 (Prisma CLI) |
   | `CLOUDINARY_CLOUD_NAME` | from §4 |
   | `CLOUDINARY_API_KEY` | from §4 |
   | `CLOUDINARY_API_SECRET` | from §4 |
   | `CORS_ORIGINS` | leave blank for now — set in §6 after Vercel exists |
   | `APP_URL` | leave blank for now — set in §6 |
   | `SUPPORT_EMAIL` | your support mailbox |
   | `SMTP_HOST` | `smtp-relay.brevo.com` (or blank to disable email) |
   | `SMTP_USER` | Brevo SMTP login (see §5c) |
   | `SMTP_PASS` | Brevo SMTP key |

   `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are generated automatically
   (`generateValue: true`) — copy them somewhere safe.

4. **Apply**. The first Docker build takes ~5–10 minutes (monorepo `npm ci`).

### 5b. Or deploy manually (same result)

Render → **New → Web Service** → repo → **Docker**:

- Dockerfile path: `apps/api/Dockerfile`
- Docker context / root directory: repo root (`.`)
- Health check path: `/health`
- Plan: **Free**, Region: Singapore
- Add the env vars from the table above plus `NODE_ENV=production`,
  `API_PREFIX=/api/v1`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (see the full
  list in §8).

### 5c. Brevo SMTP credentials

1. Brevo → **SMTP & API → SMTP** tab (also under *Settings → SMTP & API*).
2. **Senders, Domains & IPs → Senders** → add and verify the address you want
   to send from (Gmail addresses are fine; verification is a click in the inbox).
3. Copy the SMTP **login** (usually your Brevo account email) and the **SMTP
   key** (a long password, not your account password).
4. On Render set:

   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=<Brevo SMTP login>
   SMTP_PASS=<Brevo SMTP key>
   EMAIL_FROM="Community Events <verified-sender@example.com>"
   ```

> New Brevo accounts occasionally need the SMTP relay "activated" by support
> before the first send. If auth fails with 525/535, open a ticket — it is
> usually approved within a few hours.

### 5d. Confirm the API is alive

The service URL is shown at the top of the Render dashboard, e.g.
`https://community-events-api.onrender.com`.

```powershell
& curl.exe -s https://community-events-api.onrender.com/health
# {"status":"ok","database":"up",...}
```

The container runs `prisma db push` on every boot, so the schema is created on
the first successful start. Check the Render log for `✓ Database connected` and
`[email] SMTP ready (smtp-relay.brevo.com:2525)`.

---

## 6. Step 4 — Vercel web

1. Vercel → **Add New → Project** → import the same GitHub repo.
2. **Root Directory:** `apps/web` (Vercel detects the npm workspace and installs
   from the repo root automatically).
3. Framework preset: **Next.js**. Leave build/output commands at their defaults.
4. Add environment variables **before** the first build — `NEXT_PUBLIC_*` values
   are compiled into the browser bundle at build time:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://community-events-api.onrender.com/api/v1` |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` |
   | `NEXT_PUBLIC_APP_NAME` | `Community Events` |
   | `API_INTERNAL_URL` | same as `NEXT_PUBLIC_API_URL` (used by server components) |

   The project name you choose determines the URL. If Vercel assigns a different
   one (`project-name-abc123.vercel.app`), update `NEXT_PUBLIC_APP_URL` and
   redeploy — it feeds canonical URLs, sitemap and share links.

5. **Deploy**, then copy the production URL.
6. Go back to Render → `community-events-api` → **Environment** and set:

   ```
   CORS_ORIGINS=https://<your-project>.vercel.app
   APP_URL=https://<your-project>.vercel.app
   ```

   Save (Render redeploys automatically). Without this the browser blocks every
   API call with a CORS error.

---

## 7. Step 5 — Create the schema and seed the data

Seeding needs dev dependencies (`tsx`, `bcrypt`, the JSON datasets), so run it
**from your machine** against the Neon database. The seed is idempotent —
re-running it is safe.

```powershell
cd C:\Users\Ali\Desktop\islamic-event

# Point at Neon for this shell session only.
# (Your apps/api/.env still points at localhost, so local dev is unaffected.)
# The Prisma CLI uses DATABASE_URL_UNPOOLED (direct); the app/seed uses
# DATABASE_URL (pooled).
$env:DATABASE_URL = "postgresql://...-pooler...neon.tech/neondb?sslmode=require"
$env:DATABASE_URL_UNPOOLED = "postgresql://...neon.tech/neondb?sslmode=require"

# Create/refresh the schema (same thing the container does on boot).
npx prisma db push --schema apps/api/prisma/schema.prisma

# Seed categories, 458 cities, all directories, 42 expo events and the admin.
$env:SEED_SUPER_ADMIN_EMAIL = "you@example.com"
$env:SEED_SUPER_ADMIN_PASSWORD = "a-strong-password-12+"
npm run db:seed --workspace apps/api
```

Verify in the Neon SQL editor:

```sql
select count(*) from events where status = 'APPROVED';   -- expect 42+ (expos)
select count(*) from categories;                          -- expect 16
select email, role from users where role = 'SUPER_ADMIN';
```

Log in at `https://<your-project>.vercel.app/login` with the seeded admin.

> **Windows gotcha:** `npm` prints notices to stderr, so PowerShell may report
> exit code 1 even on success. Judge by the `✓ … seeded` lines, not the colour.

---

## 8. Environment variable reference

### API (Render)

| Variable | Required | Example / notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` (enables strict JWT validation + `trust proxy`) |
| `DATABASE_URL` | yes | Neon pooled (`-pooler`) URL, keep `?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | yes | Neon direct URL — Prisma CLI (`db push`/migrate) uses it |
| `JWT_ACCESS_SECRET` | yes | ≥ 32 chars, not a placeholder, different from refresh |
| `JWT_REFRESH_SECRET` | yes | ≥ 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` |
| `CLOUDINARY_CLOUD_NAME` | yes | boot fails without it |
| `CLOUDINARY_API_KEY` | yes | boot fails without it |
| `CLOUDINARY_API_SECRET` | yes | boot fails without it |
| `CORS_ORIGINS` | yes | Vercel origin, comma-separated for more |
| `APP_URL` | yes | Vercel URL — used in email links |
| `SUPPORT_EMAIL` | no | shown in email footers |
| `SMTP_HOST` | no | `smtp-relay.brevo.com`; empty = emails written to disk, not sent |
| `SMTP_PORT` | no | `2525` on Render |
| `SMTP_SECURE` | no | `false` for 2525/587 (STARTTLS), `true` for 465 |
| `SMTP_USER` / `SMTP_PASS` | no | Brevo SMTP login / key |
| `EMAIL_FROM` | no | defaults to `Community Events <SMTP_USER>` |
| `API_PREFIX` | no | `/api/v1` |
| `PORT` | no | Render injects it; do not set |

### Web (Vercel)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | inlined at build — changing it needs a redeploy |
| `NEXT_PUBLIC_APP_URL` | yes | inlined at build (canonical/OG URLs, sitemap) |
| `NEXT_PUBLIC_APP_NAME` | no | defaults to `Community Events` |
| `API_INTERNAL_URL` | recommended | server-component fetches; runtime value |

---

## 9. Post-deploy smoke test

- [ ] `GET https://<api>/health` → `"status":"ok"` and `"database":"up"`
- [ ] Home page lists events (wait for the first cold start)
- [ ] `/categories/expo` → 42 events; a detail page renders venue + map
- [ ] Register a new account → verification email arrives (check spam)
- [ ] Log in as the seeded super admin → `/admin` dashboard loads
- [ ] Forgot password → reset email arrives → new password works
- [ ] Upload an event image (real Cloudinary keys) — or confirm a clear error
- [ ] `CORS_ORIGINS` has no trailing slash and matches the Vercel URL exactly

---

## 10. Keeping the API warm (optional)

Render free services sleep after 15 minutes of inactivity. The first request
then takes ~50 s, and server-rendered pages show empty sections until the API
wakes.

Options:

- **Do nothing.** Fine for low traffic; pages fill in after a reload.
- **Ping `/health` every 10 minutes** with a free monitor
  ([cron-job.org](https://cron-job.org) or UptimeRobot). This keeps the service
  awake, but it then consumes ~730 of your 750 free instance-hours per month —
  no room for a second free service. A monitoring pinger also gives you uptime
  alerts, which is genuinely useful.

Background jobs (the hourly 24-hour RSVP reminder sweep) only run while the
service is awake, so reminders are best-effort on the free plan.

---

## 11. Updating the deployment

Both hosts auto-deploy on push to `main`:

```powershell
git add .
git commit -m "feat: ..."
git push origin main
```

- Vercel rebuilds the web app (~2 min).
- Render rebuilds the API image (~5–10 min) and runs `prisma db push` on boot.

Schema changes: update `apps/api/prisma/schema.prisma`, then either rely on the
container's `db push`, or run `npx prisma migrate dev` locally and
`npx prisma migrate deploy` against Neon. Do not run `migrate dev` against Neon —
it is interactive and can reset data.

---

## 12. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Render deploy fails at boot: `Invalid environment configuration … CLOUDINARY_*` | Add all three Cloudinary vars |
| `JWT_ACCESS_SECRET must be at least 32 characters` | Use a real 64-char hex secret, not `your-…` |
| Browser console: blocked by CORS | `CORS_ORIGINS` on Render must be the exact Vercel origin, no trailing slash |
| Every page is empty, API returns 502 | Service asleep or crashed — check Render logs, hit `/health` |
| Verification email never arrives, log says `[email] SMTP is not configured` | `SMTP_HOST` is empty — set the Brevo vars and redeploy |
| SMTP error `ETIMEDOUT` / `ECONNECTION` on port 465/587 | Render blocks those ports — use `2525` |
| Brevo `535 Authentication failed` | Wrong SMTP key (not account password), or relay not yet activated |
| `P1001: Can't reach database server` | `DATABASE_URL` typo or missing `?sslmode=require` |
| `P1001` only locally, while `psql`/ping works | Broken IPv6 route: Neon's AAAA records are tried first. Disable IPv6 on the adapter, or append `&connect_timeout=150&pool_timeout=200` to the URL |
| Vercel build error about files outside the project root | Root Directory must be `apps/web`; the custom `outputFileTracingRoot` is skipped on Vercel |
| Uploads fail with a Cloudinary error | Placeholder/invalid keys, or the unsigned-upload preset is disabled |

---

## 13. Plan B — Gmail SMTP on Oracle Cloud Always Free

If you specifically want the Gmail app password to work in production, run the
API (or the whole stack) on an Oracle Cloud **Always Free** ARM VM instead of
Render. Outbound 465/587 is allowed there.

1. Oracle Cloud → Always Free → Ampere A1 (4 OCPU / 24 GB) instance, Ubuntu 22.04.
2. Open ingress for `80`/`443` in the VCN security list.
3. Install Docker + Compose, clone the repo, copy `.env.example` to `.env`.
4. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, plus the
   Gmail address/app password.
5. `docker compose up -d --build`, then point your domain at the VM's public IP.

Pros: no sleep, no SMTP restrictions, no cold starts. Cons: you maintain the OS,
patch it, and configure TLS (Caddy or Nginx + Certbot). The Vercel front end can
still stay on Vercel and talk to this VM over HTTPS.

---

## 14. Cost summary

| Service | Monthly |
| --- | --- |
| Vercel Hobby | $0 |
| Render free web service | $0 |
| Neon free | $0 |
| Cloudinary free | $0 |
| Brevo free (300/day) | $0 |
| **Total** | **$0** |

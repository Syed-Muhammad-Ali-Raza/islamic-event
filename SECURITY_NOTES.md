# Security Notes — Community Events Platform

Last audited: 2026-10-13 · Scope: working tree + full local git history (`git log --all -S/-G`), including the GitHub remote `Syed-Muhammad-Ali-Raza/islamic-event`.

**No secret values are reproduced in this file by design.**

## 1. Committed secrets — findings

### History scan results (safe to keep)

| Finding | Where | Verdict |
| --- | --- | --- |
| JWT secrets `ci-access-secret` / `ci-refresh-secret` | `.github/workflows/ci.yml` (commit `83f7b07`, `44173be`) | GitHub Actions **placeholders** for the throwaway CI container — not real secrets. Startup validation (§3) rejects them if ever used with `NODE_ENV=production`. |
| JWT secrets `test-access-secret` / `test-refresh-secret` | `apps/api/tests/setup-env.ts` | Jest **test defaults** — isolated test DB only. Not real secrets. |
| Cloudinary values `ci-secret` / `test-secret`, `your-*` | CI workflow, test setup, `.env.example` | **Placeholders** — no real Cloudinary credentials were ever committed. |
| DB URL `postgresql://postgres:postgres@localhost:5432/...` | CI workflow + test setup | GitHub Actions **service container** credentials — not real secrets. |
| Default admin password `Admin@123456` | Hardcoded in `prisma/seed.ts` (commits `94efad0`, `6138cbd`); removed in `7c9e7d9` | **Weak dev credential, published in history.** See rotation list below. |
| SMTP credentials | — | **Never committed**; `SMTP_PASS` is empty in local `.env`. |
| GitHub tokens (`ghp_`, `github_pat_`), Stripe (`sk_live`), private keys, hosted-DB URLs (neon.tech / supabase.co / render.com) | — | **None found anywhere in history.** |

### Not committed (verified clean)

- No `.env`, `.env.local`, or any env file was ever committed (`git log --all --full-history -- .env **/.env` → empty).
- `.gitignore` now covers `.env`, `.env.*`, with an explicit `!.env.example` exception.
- Local untracked secrets that must **stay** untracked:
  - root `.env` and `apps/api/.env` contain real-looking **48-char JWT secrets**;
  - root `.env` contains what looks like a **real Cloudinary credential set** (9-char cloud name / 15-char API key / 27-char API secret). Note: `apps/api/.env` (found first by the loader) holds placeholders, so the real credentials are currently shadowed — uploads fail locally either way.

## 2. What to rotate

1. **`Admin@123456`** — it is public in git history. It may still be the local dev DB admin password (the seed no longer uses it; CI now uses a distinct throwaway value).
   - If this password (or the account) was ever reused outside throwaway environments: **change it now** (`apps/api/.env`: set `SEED_SUPER_ADMIN_PASSWORD`, reseed on a fresh DB, or follow the manual runbook in `apps/api/prisma/ops/rotate-default-admin.sql` — the org-approval migration promotes this account to SUPER_ADMIN, so rotating it matters even more on upgraded deployments).
   - Rotating git history (filter-repo/BFG) is **not** recommended here: the value is a throwaway dev credential, and history rewriting force-pushes the whole repo.
2. **Cloudinary keys in root `.env`** — rotate **only if** that `.env` was ever shared (zip/backup/chat). Otherwise they never left this machine.
3. **Production JWT secrets** — must be fresh random values (≥32 chars, access ≠ refresh), never the CI/test/`your-*` placeholders. The API now **refuses to start** in production with weak/placeholder secrets (§3), so rotation = setting new values in the hosting provider's env dashboard.
4. Nothing else from the committed history requires rotation (all committed values are placeholders or service-container credentials).

## 3. Startup validation (added)

`apps/api/src/config/index.ts` validates the environment with zod **at import time** (fail-fast on server boot, tests, scripts):

- Required: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`; image storage (`S3_*` or `CLOUDINARY_*`) is optional and uploads answer `503` when absent — missing/empty → boot aborts with a list of key **names** (values are never printed).
- In `NODE_ENV=production` additionally:
  - each JWT secret must be ≥32 characters,
  - placeholder values (`your-*`, `changeme`, `ci-*`, `test-*`, `secret`) are rejected,
  - `JWT_ACCESS_SECRET` must differ from `JWT_REFRESH_SECRET`.
- In development, placeholder JWT secrets only print a one-line warning.

## 4. Rate limiting

Configured in `apps/api/src/middleware/rateLimit.middleware.ts` and attached in `app.ts` (global) plus `modules/auth/auth.routes.ts` (per route). All windows are 15 minutes and keyed by client IP (`trust proxy` is set to 1 in production so the IP comes from the platform proxy, not a spoofable header).

| Limiter | Max / 15 min | Applies to |
|---|---|---|
| `generalLimiter` | 300 | every `/api/v1/*` request |
| `authLimiter` | 60 | ceiling for everything under `/api/v1/auth` |
| `loginLimiter` | 10 **failures** | `POST /auth/login` (successful logins are not counted) |
| `registerLimiter` | 12 | `POST /auth/register` |
| `passwordResetLimiter` | 5 | `POST /auth/forgot-password`, `POST /auth/resend-verification` (they send email) |
| `resetPasswordLimiter` | 10 | `POST /auth/reset-password`, `POST /auth/change-password` |
| `verifyEmailLimiter` | 30 | `POST /auth/verify-email` |
| `sessionLimiter` | 120 | `POST /auth/refresh`, `POST /auth/logout`, `GET/PATCH /auth/me` |

Exceeding a limit returns `429` with `{ success: false, message, code: "RATE_LIMITED" }` and `RateLimit-*` headers. Login additionally has the DB-backed account lockout (5 failures / 15 min → `429 ACCOUNT_LOCKED`), which works across instances.

**Caveat:** `express-rate-limit`'s default store is in-memory, so on serverless each instance keeps its own counters and a cold start resets them. Treat the IP limits as best-effort abuse friction; the account lockout is the strong control. Tests bypass all limiters (`NODE_ENV=test`); `tests/rate-limit.test.ts` exercises the limiter factory directly so the 429 path stays covered.

## 5. Reporting

Found a secret that this file misses? Open a GitHub issue (without pasting the value) or contact the maintainer privately.

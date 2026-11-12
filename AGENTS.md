# AGENTS.md — Community Events Platform

Monorepo for a Pakistan-focused community events platform. **Follow these conventions when working in this repo.**

## Stack

| App | Tech | Port |
|---|---|---|
| `apps/web` | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query | 3000 |
| `apps/api` | Express 4, TypeScript, Prisma 5 (PostgreSQL), zod, JWT auth, jest + supertest | 4000 |
| `packages/shared` | Shared types | — |

- Node **v24.8.0** (`C:\Program Files\nodejs`) — see Gotchas for the shadowing bug.
- PostgreSQL: `postgres:12345@localhost:5432`. Dev DB `community_events`, test DB `community_events_test`.
- Workspace commands run from the **repo root** with `npm run <script> --workspace apps/<app>`.

## Essential commands

```bash
npm run dev              # both apps (use full-path variant below on Windows)
npm run dev:api          # API only
npm run dev:web          # web only
npm run build            # build both
npm run test             # all workspaces (web=vitest, api=jest)
npm run test --workspace apps/api         # API jest only
npx jest tests/foo.test.ts                # single suite (run from apps/api, NOT --root)
npm run typecheck        # tsc both
npm run lint --workspace apps/web         # eslint (web only; API has no lint script — tsc covers it)
npm run db:seed --workspace apps/api      # idempotent seed from prisma/data/*.json
npm run db:push --workspace apps/api      # schema push (also regenerates client)
npm run brevo:check --workspace apps/api -- <key> <sender>   # validate (add :push to update Vercel)
npm run smtp:setup --workspace apps/api -- <gmail|brevo|host:port> <user> <pass> <sender> [--to me@x.com]
# add :push to either script name to also update Vercel Production
npx prisma generate --schema apps/api/prisma/schema.prisma
```

## Windows / environment gotchas (all hit in practice)

- **Rogue Node v26** at `C:\Users\Senarios\node_modules\node\bin\node.exe` shadows Program Files node → breaks esbuild/tsx/build workers and can squat port 3000. Start servers via full path and verify build exit codes:
  ```powershell
  Start-Process cmd -ArgumentList '/c', 'call "C:\Program Files\nodejs\npm.cmd" run dev:api > logs\api.log 2>&1' -WindowStyle Hidden
  npm run build > $null 2>&1; "build=$LASTEXITCODE"   # never trust a pipeline that clobbers $LASTEXITCODE
  ```
- Kill stale `node.exe` (next/tsx) **before** `prisma generate` (EPERM = query-engine DLL held by the API server).
- PowerShell 5.1: no `??`; `-Path` treats `[slug]` as a wildcard → use the read/write/edit tools for bracketed dirs (`app/categories/[slug]/`).
- `& curl.exe -s` returns a line **array** — `-join ""` before `.Contains()`/`-match`.
- **Never** PowerShell `-replace` with backtick-escaped strings — use the edit tool. Same trap when appending prose: backticks inside a double-quoted string are escapes (`` `r `` = CR, `` `a `` = BEL), which shredded a `docs/PHASES.md` entry — write the text to a file and concatenate it with a node script instead.
- Mojibake box-drawing comments in `app.ts` can't be matched literally in edit oldStrings — use ASCII anchors.

## Testing

- API: jest + supertest, root `npm run test` = `npm run test --workspaces`. Reset test DB once per file run; **tests in the same file share DB** — filter assertions by `unique()`-suffixed city/field or fixtures collide.
- Helpers (`apps/api/tests/helpers.ts`): `api()`, `unique(prefix)`, `registerUser(prefix)`, `createAdmin`, `createCategory`, `createEventAs(creatorId, categoryId, overrides?)`.
- Test API conventions: 422 zod, 401 unauth, 403 role/origin, 404 notFound, 409 conflict, 429 rate/lockout.
- Web: vitest (`lib/i18n.test.ts` enforces exact i18n key parity across 4 locales; `lib/seo.test.ts` covers JSON-LD `startDate`/geo/address output).
- **E2E (Playwright)**: root `e2e/` + `playwright.config.ts`. Run `npm run test:e2e` (or `test:e2e:ui`). `workers: 1` is intentional — the suite registers ~8 accounts per run and the API allows 12 sign-ups / 15 min per IP (plus a 60/15 min ceiling on all `/auth` routes). `webServer` auto-starts API+web with full-path npm on Windows and reuses already-running servers (`reuseExistingServer: !CI`). CI: the `e2e` job in `.github/workflows/ci.yml` (`needs: ci`) pushes+seeds the DB, sets placeholder `CLOUDINARY_*` (harmless leftovers — image vars are optional since Phase 44) and runs the suite headless; report/traces upload as artifacts on failure. The browser download is cached (`~/.cache/ms-playwright`, keyed on `package-lock.json`) and `npx playwright install --with-deps chromium` retries 3× with a 15 s backoff — a single CDN hiccup used to red the whole pipeline and skip Deploy. Helpers in `e2e/fixtures.ts`: `registerViaApi`, `loginViaApi`, `loginAdminViaApi`, `seedAuth` (zustand `auth-storage` shape `{ state: { user, accessToken, refreshToken, isAuthenticated }, version: 0 }`), `createEventViaApi` (returns `body.data.event`), `approveEventViaApi` (admin PATCH). Seeded super admin comes from `SEED_SUPER_ADMIN_EMAIL`/`SEED_SUPER_ADMIN_PASSWORD` env (no hardcoded password — the seed throws if the password var is missing; CI sets a throwaway value; `playwright.config.ts` loads apps/api/.env + root .env so local e2e matches local seed; existing user's password is never overwritten; production requires 12+ chars). Event-create wizard: Continue→Submit buttons swap on the last step — wait for step content (`aria-current="step"`) not just button text. Created events are `PENDING_REVIEW` and detail 404s until approved.

## Conventions

### API module pattern (mirrored across dastarkhwans, imambargahs, places, darbars, urs-dates, processions, charities, melas, auqaf-urs-dates, scholars)

```
src/modules/<name>/        # <name>.validation.ts, .service.ts, .controller.ts, .routes.ts
```
- Prisma model: `sourceId String @unique`, `isActive Boolean @default(true)`, `@@map("<snake_case>")`.
- Seed: idempotent `upsert` on `sourceId` with `update: {}`, reading JSON from `apps/api/prisma/data/`. `seed.ts` has its own project `apps/api/prisma/tsconfig.json` — standalone (not `extends`), `types: ["node"]`, `module: node16`, `noEmit`; don't merge it into the api tsconfig (`rootDir: ./src`) or extend the api one (its `baseUrl`/`moduleResolution: node` deprecate under editors' bundled TS 6.x).
- Public list routes use `validateQuery` + `sendPaginated`; `q` search is case-insensitive (`mode: "insensitive"`).
- Mount in `src/app.ts`; rate-limit public GETs with the existing public limiter.

### Image uploads

- One endpoint: `POST /api/v1/upload/poster` (auth + optional `eventId`), returning `{ url, publicId, width, height, format, bytes, provider }`.
- Backend selection lives in `apps/api/src/modules/upload/storage.service.ts`: S3-compatible (`S3_*` or `AWS_*` env) first, Cloudinary only as a fallback, `503 IMAGE_STORAGE_UNAVAILABLE` when neither. Never make Cloudinary boot-required again.
- Uploads are re-encoded with `sharp` to WebP at ≤1600 px (best effort — undecodable files are stored as-is). Keys are `events/<yyyy-mm>/<uuid>.<ext>`, immutable, `Cache-Control: public, max-age=31536000, immutable`. `publicId` is the object key, so deletes are `DeleteObject`.
- Bucket must be `public_read`; the public URL is `<S3_ENDPOINT_URL>/<S3_BUCKET>/<key>` (override with `S3_PUBLIC_BASE_URL`). New bucket hosts must be allow-listed for `next/image` via `NEXT_PUBLIC_IMAGE_HOSTS` in `apps/web/next.config.js`.
- Multer failures map to `413 PAYLOAD_TOO_LARGE` (over 10 MB) and `400 INVALID_FILE_TYPE` (extension + MIME must both be jpg/png/webp) — keep it that way instead of a generic 500.

### Web

- Category-conditional sections render inside `app/categories/[slug]/page.tsx` (slug === "muharram" → Jaloos, "charity" → CharityDirectory, "urs" → UpcomingUrs). Server-fetch via `fetchPaginated`, pass to a `"use client"` component.
- Directory pages pattern: copy JSON → API module → web types + service + hook + page + Navbar link + i18n nav key + ~6-8 jest tests.
- i18n: 4 locales (en/ur/hi/ar) in `lib/i18n.ts`; nav block at 6-space indent `      nav: {`, keys 8-space. Insert via UTF-8-safe node **script file** at `%TEMP%\opencode\` (inline `node -e` with escaped quotes breaks). i18n parity is test-enforced.
- SEO/AEO: `app/robots.ts` (named crawler + AI-agent allow-list, private paths closed), `app/sitemap.ts` (paginated API fan-out, image entries from `posterUrl`, real `lastModified`), `app/llms.txt/route.ts` (cached plain-text map for answer engines, linked from `<head>`), `lib/seo.ts` JSON-LD builders (`eventJsonLd` emits `PostalAddress`/`GeoCoordinates` and slices the API's ISO `date` to `YYYY-MM-DD` — never append a time before slicing), `app/organizers/(list)/layout.tsx` + `dashboard`/`approvals` layouts for per-route metadata. Search Console/Bing tokens come from `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION`, so a new domain needs env + redeploy, not code.

### Verify batch (run before calling a phase done)

1. `npx tsc --noEmit -p apps/api`, `-p apps/api/prisma` and `-p apps/web` (from repo root)
2. `npm run lint --workspace apps/web`
3. `npm run test --workspace apps/api` (expect 28 suites / 256 tests) + web vitest
4. Kill servers → `npm run build` (check `$LASTEXITCODE`) → restart via full path
5. Live smoke: `curl` API endpoint + rendered HTML contains expected markers (`-join ""` first)

## Data sources

Curated JSON in `apps/api/prisma/data/`: dastarkhwan-points, imambargahs, pakistan-places, pakistan-darbars, pakistan-urs-dates, muharram-processions, pakistan-charities, pakistan-melas (melas + auqaf_urs_calendar), scholars (sunni + shia), pakistan-expos (42 seeded APPROVED expo/trade-show events under the `expo` category, owned by the seeded "Pakistan Expo & Trade Show Desk" organizer). All seeded idempotently; re-run `npm run db:seed --workspace apps/api` after editing.

## Security baseline (already in place — don't regress)

helmet, CORS allow-list, tiered rate limiting (300/15 min global, 60/15 min on `/auth`, 10 failed logins, 12 sign-ups, 5 reset emails — see `middleware/rateLimit.middleware.ts`), bcrypt, JWT, zod validation, upload allow-list (jpeg/png/webp, 10 MB), account lockout (5 fails/15 min → 429 `ACCOUNT_LOCKED`), CSRF origin guard on state-changing requests, `trust proxy` in production, Next.js security headers (Referrer-Policy, Permissions-Policy). Image storage is S3-compatible (Neon Object Storage, `public_read` bucket) with Cloudinary only as a fallback; `CLOUDINARY_*` is **not** boot-required. Uploads fail closed: `503 IMAGE_STORAGE_UNAVAILABLE` when no backend is configured.

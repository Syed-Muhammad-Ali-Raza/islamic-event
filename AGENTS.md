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
- **Never** PowerShell `-replace` with backtick-escaped strings — use the edit tool.
- Mojibake box-drawing comments in `app.ts` can't be matched literally in edit oldStrings — use ASCII anchors.

## Testing

- API: jest + supertest, root `npm run test` = `npm run test --workspaces`. Reset test DB once per file run; **tests in the same file share DB** — filter assertions by `unique()`-suffixed city/field or fixtures collide.
- Helpers (`apps/api/tests/helpers.ts`): `api()`, `unique(prefix)`, `registerUser(prefix)`, `createAdmin`, `createCategory`, `createEventAs(creatorId, categoryId, overrides?)`.
- Test API conventions: 422 zod, 401 unauth, 403 role/origin, 404 notFound, 409 conflict, 429 rate/lockout.
- Web: vitest (`lib/i18n.test.ts` enforces exact i18n key parity across 4 locales).

## Conventions

### API module pattern (mirrored across dastarkhwans, imambargahs, places, darbars, urs-dates, processions, charities)

```
src/modules/<name>/        # <name>.validation.ts, .service.ts, .controller.ts, .routes.ts
```
- Prisma model: `sourceId String @unique`, `isActive Boolean @default(true)`, `@@map("<snake_case>")`.
- Seed: idempotent `upsert` on `sourceId` with `update: {}`, reading JSON from `apps/api/prisma/data/`.
- Public list routes use `validateQuery` + `sendPaginated`; `q` search is case-insensitive (`mode: "insensitive"`).
- Mount in `src/app.ts`; rate-limit public GETs with the existing public limiter.

### Web

- Category-conditional sections render inside `app/categories/[slug]/page.tsx` (slug === "muharram" → Jaloos, "charity" → CharityDirectory, "urs" → UpcomingUrs). Server-fetch via `fetchPaginated`, pass to a `"use client"` component.
- Directory pages pattern: copy JSON → API module → web types + service + hook + page + Navbar link + i18n nav key + ~6-8 jest tests.
- i18n: 4 locales (en/ur/hi/ar) in `lib/i18n.ts`; nav block at 6-space indent `      nav: {`, keys 8-space. Insert via UTF-8-safe node **script file** at `%TEMP%\opencode\` (inline `node -e` with escaped quotes breaks). i18n parity is test-enforced.

### Verify batch (run before calling a phase done)

1. `npx tsc --noEmit -p apps/api` and `-p apps/web` (from repo root)
2. `npm run lint --workspace apps/web`
3. `npm run test --workspace apps/api` (expect ~144+ tests) + web vitest
4. Kill servers → `npm run build` (check `$LASTEXITCODE`) → restart via full path
5. Live smoke: `curl` API endpoint + rendered HTML contains expected markers (`-join ""` first)

## Data sources

Curated JSON in `apps/api/prisma/data/`: dastarkhwan-points, imambargahs, pakistan-places, pakistan-darbars, pakistan-urs-dates, muharram-processions, pakistan-charities. All seeded idempotently; re-run `npm run db:seed --workspace apps/api` after editing.

## Security baseline (already in place — don't regress)

helmet, CORS allow-list, rate limiting, bcrypt, JWT, zod validation, upload allow-list (jpeg/png/webp, 10MB), account lockout (5 fails/15 min → 429 `ACCOUNT_LOCKED`), CSRF origin guard on state-changing requests, `trust proxy` in production, Next.js security headers (Referrer-Policy, Permissions-Policy). Cloudinary creds are placeholders — uploads fail (known).

# ─── Build ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Prisma's engines need the openssl CLI to detect the libssl version on Alpine.
RUN apk add --no-cache openssl

# Workspace layout: npm ci needs every workspace manifest (workspaces are
# validated against the lockfile), but sources are copied in a second step to
# keep the dependency layer cacheable.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY apps/api apps/api
COPY packages/shared packages/shared

# Prisma client must be generated ON linux-musl so the engine binaries match
# the runtime image.
RUN npm run db:generate --workspace apps/api \
 && npm run build --workspace apps/api

# ─── Runtime ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# .env files are excluded via .dockerignore — config comes from the
# environment at runtime (docker-compose.yml / orchestrator).
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma

USER node
EXPOSE 4000

# This repo has no committed migrations (apps/api/prisma/migrations/ is
# gitignored), so the schema is synced with `prisma db push` before start —
# the repo-equivalent of `prisma migrate deploy` on a fresh database.
CMD ["sh", "-c", "cd apps/api && npx prisma db push --skip-generate && node dist/server.js"]

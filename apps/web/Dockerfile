# ─── Build ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time. Defaults
# match local `docker compose up` (browser on the host reaches localhost).
# Production deploys pass real URLs as build args (docker-compose.yml does).
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME="Community Events"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY apps/web apps/web
COPY packages/shared packages/shared
RUN npm run build --workspace apps/web

# ─── Runtime (Next.js standalone) ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# standalone/ mirrors the monorepo (outputFileTracingRoot = repo root):
#   server.js ends up at apps/web/server.js.
# NOTE: there is no apps/web/public directory yet — add
#   COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
# here if/when one is created.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

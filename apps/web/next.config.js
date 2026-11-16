/** @type {import('next').NextConfig} */
const path = require("path");

// Vercel produces its own build output and handles monorepo file tracing, so
// the standalone bundle + custom tracing root are only applied for Docker
// builds (docker-compose, self-hosting). VERCEL=1 is set by the platform.
const isVercel = process.env.VERCEL === "1";

// Poster images are served straight from the object-storage bucket, so
// next/image needs each storage host allow-listed. Comma-separated override
// (e.g. a preview branch's own endpoint) plus the production branch endpoint.
const imageHosts = (
  process.env.NEXT_PUBLIC_IMAGE_HOSTS ??
  "br-frosty-firefly-bdn5bzow.storage.c-8.us-east-2.aws.neon.tech"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

// ─── Edge caching for public pages ───────────────────────────────────────────
//
// Prerendered public routes are served from the CDN, but without an explicit
// `s-maxage` each view revalidates against the origin. These rules let the CDN
// answer repeat views and crawler hits for a minute.
//
// Caveat, verified against production: routes that read `searchParams` (the
// directory/events pages) are rendered dynamically, and Next.js answers those
// with `Cache-Control: private, no-store` regardless of this config, so their
// HTML is never edge-cached. Their cost is instead removed at the data layer —
// see `apps/api/src/middleware/cache.middleware.ts`, which marks the public
// directory APIs shared-cacheable. `stale-while-revalidate` keeps a
// revalidation from ever landing as a slow request.
const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";
const PRIVATE_CACHE = "private, no-cache, no-store, max-age=0, must-revalidate";
const PUBLIC_PATHS = [
  "/",
  "/events",
  "/events/:slug",
  "/categories",
  "/categories/:slug",
  "/cities",
  "/cities/:slug",
  "/organizers",
  "/organizers/:slug",
  "/dastarkhwan",
  "/imambargahs",
  "/places",
  "/darbars",
  "/scholars",
  "/melas",
  "/privacy",
  "/terms",
];
// Auth-gated or user-specific routes. Listed *after* the public rules because
// Next applies matching headers in order and the last one wins — these also
// shadow public prefixes (`/events/create` would otherwise match `/events/:slug`).
const PRIVATE_PATHS = [
  "/events/create",
  "/admin/:path*",
  "/approvals",
  "/dashboard",
  "/profile/:path*",
  "/saved",
  "/super-admin/:path*",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];
const cacheHeader = (value) => ({ key: "Cache-Control", value });

const nextConfig = {
  ...(isVercel
    ? {}
    : {
        output: "standalone",
        outputFileTracingRoot: path.join(__dirname, "../.."),
      }),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      ...imageHosts.map((hostname) => ({
        protocol: "https",
        hostname,
        pathname: "/**",
      })),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        source: "/(admin|profile|saved|events/create)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // Public HTML → cacheable at the edge; everything personal → never cached.
      ...PUBLIC_PATHS.map((source) => ({
        source,
        headers: [cacheHeader(PUBLIC_CACHE)],
      })),
      ...PRIVATE_PATHS.map((source) => ({
        source,
        headers: [cacheHeader(PRIVATE_CACHE)],
      })),
    ];
  },
};

module.exports = nextConfig;

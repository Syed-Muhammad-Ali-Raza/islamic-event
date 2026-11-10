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
    ];
  },
};

module.exports = nextConfig;

import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Auth-gated routes. They render a login wall or another user's private data,
// so indexing them only produces thin/duplicate pages. Closed to every crawler,
// search engines and answer engines alike.
const PRIVATE_PATHS = [
  "/admin",
  "/super-admin",
  "/dashboard",
  "/approvals",
  "/profile",
  "/saved",
  "/events/create",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Crawlers are named explicitly instead of relying only on "*". Answer engines
// (ChatGPT, Perplexity, Claude, Gemini, Copilot, Amazon) are a discovery channel
// for this content, so the allow is deliberate and documented here; Googlebot /
// Bingbot / Applebot stay listed so a future blanket block cannot silently drop
// classic search.
const CRAWLERS = [
  "*",
  // Classic search
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Applebot",
  "DuckDuckBot",
  // Answer engines / AI assistants
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}

import { Request, Response, NextFunction } from "express";
import { config } from "../config";

// ─── Edge caching for public GETs ─────────────────────────────────────────────
//
// The directory modules are read-only and seed-driven: every caller gets the
// same JSON. Letting the CDN answer those reads keeps a warm copy in front of
// the serverless function, which removes the cold-start latency from the web
// app's SSR fetches (a cold function + Neon wake was costing 1-2 s, and up to
// 10 s on /dastarkhwan) and cuts function invocations and Neon egress.
//
// Deliberately NOT cached:
//   /events*        the list and detail responses include `isSaved` / `myRsvp`
//                   for the caller, so a shared cache would leak them
//   /auth*          credentials and tokens
//   /admin, /approvals, /notifications, /users, /internal, /upload
//   anything with an Authorization header (a future personalised field would
//                   otherwise be cached and served to everyone), and every
//                   non-GET/HEAD method
//
// `s-maxage=60` matches the web app's `fetch(..., { revalidate: 60 })` window
// and the client TanStack staleTime, so a newly approved listing appears within
// the same minute everywhere; `stale-while-revalidate` means the CDN refreshes
// in the background instead of making one visitor wait.
const CACHE_SECONDS = 60;
const STALE_SECONDS = 300;
export const PUBLIC_CACHE_CONTROL = `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`;

/** API path prefixes that are identical for every caller. */
export const CACHEABLE_PREFIXES = [
  "/categories",
  "/cities",
  "/organizers",
  "/people",
  "/dastarkhwans",
  "/imambargahs",
  "/places",
  "/darbars",
  "/urs-dates",
  "/processions",
  "/charities",
  "/melas",
  "/auqaf-urs-dates",
  "/scholars",
];

const prefixes = CACHEABLE_PREFIXES.map((p) => `${config.apiPrefix}${p}`);

export function cachePublicReads(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.headers.authorization) return next();
  if (!prefixes.some((p) => req.path === p || req.path.startsWith(`${p}/`))) {
    return next();
  }

  // Only successful reads may be cached. Setting the header eagerly would also
  // mark a 404 (unknown sourceId), a 429 (throttled) or a 5xx as shared-cacheable,
  // and a cached error keeps failing after the function has recovered — so the
  // header is applied when the response head is written, once the status is known.
  // `private` would disable the shared cache; the value must be public. Nothing
  // on these routes sets cookies, so a shared copy cannot carry session state.
  const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => Response;
  res.writeHead = function (this: Response, statusCode: number, ...rest: unknown[]) {
    if (statusCode >= 200 && statusCode < 300) {
      res.setHeader("Cache-Control", PUBLIC_CACHE_CONTROL);
    }
    return writeHead(statusCode, ...rest) as unknown as Response;
  } as Response["writeHead"];
  next();
}

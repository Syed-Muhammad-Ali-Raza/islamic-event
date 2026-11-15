import { Request, RequestHandler } from "express";
import rateLimit, { RateLimitInfo } from "express-rate-limit";
import { config } from "../config";

// ─── Rate limiting ────────────────────────────────────────────────────────────
//
// Layered limits, all keyed by client IP and windowed over 15 minutes:
//
//   generalLimiter        300  every /api/v1 route
//   authLimiter            60  ceiling for everything under /api/v1/auth
//   loginLimiter           10  failed logins (successful logins are not counted)
//   registerLimiter        12  sign-ups, counted whether they succeed or not
//   passwordResetLimiter    5  forgot-password / resend-verification (they send email)
//   resetPasswordLimiter   10  reset-password submissions (token + new password)
//   verifyEmailLimiter     30  email-verification attempts
//   sessionLimiter        120  refresh / logout / me / profile / change-password
//
// The per-route limiters sit *inside* authLimiter, so the aggregate ceiling still
// applies if a caller spreads load across endpoints. Tests run without limits
// (they would otherwise interfere with each other); `createLimiter` stays
// exported so the limiter itself can be tested in isolation.
//
// Note: express-rate-limit's default store is in-memory. On serverless hosts
// each instance keeps its own counters, so these are best-effort per instance.
// The per-account lockout in auth.service.ts is the DB-backed complement.

const WINDOW_MS = 15 * 60 * 1000;

export interface LimiterOptions {
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  windowMs?: number;
}

/** Build a rate limiter. Exported for tests that need a low `max`. */
export function createLimiter({
  max,
  message,
  skipSuccessfulRequests = false,
  windowMs = WINDOW_MS,
}: LimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    // A bare "Too many requests" tells the user nothing actionable. Send the
    // remaining window both as a `Retry-After` header and as `retryAfter`
    // seconds in the body, so the web client can count down and re-enable the
    // form exactly when the budget comes back.
    handler: (req, res, _next, options) => {
      // express-rate-limit attaches the window info under `requestPropertyName`
      // ("rateLimit") without augmenting Express's Request type in v7.
      const info = (req as Request & { rateLimit?: RateLimitInfo }).rateLimit;
      const resetTime = info?.resetTime;
      const retryAfter = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : Math.ceil(windowMs / 1000);

      res.setHeader("Retry-After", String(retryAfter));
      res.status(options.statusCode).json({
        success: false,
        message,
        code: "RATE_LIMITED",
        retryAfter,
      });
    },
  });
}

const bypass: RequestHandler = (_req, _res, next) => next();
const isTest = config.nodeEnv === "test";
const build = (options: LimiterOptions): RequestHandler =>
  isTest ? bypass : createLimiter(options);

export const generalLimiter = build({
  max: 300,
  message: "Too many requests, please try again later.",
});

export const authLimiter = build({
  max: 60,
  message: "Too many authentication attempts.",
});

export const loginLimiter = build({
  max: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

export const registerLimiter = build({
  max: 12,
  message: "Too many sign-up attempts. Please try again in 15 minutes.",
});

export const passwordResetLimiter = build({
  max: 5,
  message: "Too many password reset requests. Please try again in 15 minutes.",
});

export const resetPasswordLimiter = build({
  max: 10,
  message: "Too many password reset attempts. Please try again in 15 minutes.",
});

export const verifyEmailLimiter = build({
  max: 30,
  message: "Too many verification attempts. Please try again in 15 minutes.",
});

export const sessionLimiter = build({
  max: 120,
  message: "Too many session requests. Please try again later.",
});

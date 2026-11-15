/**
 * Normalise the shapes an axios failure can take into something the forms can
 * render. The API answers 429 with `{ message, code, retryAfter }` (see
 * `rateLimit.middleware.ts` / `Errors.tooManyAttempts`), and some proxies only
 * forward the `Retry-After` header — both are understood here.
 */
export interface ApiErrorInfo {
  message: string;
  code?: string;
  status?: number;
  /** Seconds until the caller may retry. Only set for 429 responses. */
  retryAfter?: number;
}

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: { message?: string; code?: string; retryAfter?: number };
    headers?: Record<string, unknown>;
  };
  message?: string;
}

export function parseApiError(error: unknown, fallback: string): ApiErrorInfo {
  const candidate = (error ?? {}) as AxiosLikeError;
  const response = candidate.response;
  const data = response?.data ?? {};
  const status = response?.status;

  let retryAfter: number | undefined;
  if (typeof data.retryAfter === "number" && data.retryAfter > 0) {
    retryAfter = data.retryAfter;
  } else {
    const header = response?.headers?.["retry-after"];
    const parsed = typeof header === "string" ? Number(header) : Number(header);
    if (Number.isFinite(parsed) && parsed > 0) retryAfter = parsed;
  }

  return {
    message: data.message ?? fallback,
    code: data.code,
    status,
    // A stale `retryAfter` on a 200/401 body would start a bogus countdown.
    retryAfter: status === 429 ? retryAfter : undefined,
  };
}

/** True when the request was throttled, so React Query must not retry it. */
export function isRateLimited(error: unknown): boolean {
  return (error as AxiosLikeError | undefined)?.response?.status === 429;
}

/** 167 → "2:47", 59 → "59s", 0/negative → "" (nothing to count down). */
export function formatRetryAfter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.ceil(seconds);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

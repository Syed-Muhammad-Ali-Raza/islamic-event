// ─── HTTP Error Class ─────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  /**
   * Extra fields merged into the JSON body — used for `retryAfter` on 429s so
   * the client can count down instead of guessing. Never put internals here.
   */
  public readonly meta?: Record<string, unknown>;

  constructor(message: string, statusCode: number, code: string, meta?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.meta = meta;

    // Maintain prototype chain in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Common errors ────────────────────────────────────────────────────────────

export const Errors = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, `${resource.toUpperCase().replace(/\s/g, "_")}_NOT_FOUND`),

  unauthorized: (msg = "Authentication required") =>
    new AppError(msg, 401, "UNAUTHORIZED"),

  forbidden: (msg = "You do not have permission to perform this action") =>
    new AppError(msg, 403, "FORBIDDEN"),

  conflict: (msg: string, code: string) =>
    new AppError(msg, 409, code),

  badRequest: (msg: string, code = "BAD_REQUEST") =>
    new AppError(msg, 400, code),

  tooManyAttempts: (msg: string, code = "TOO_MANY_ATTEMPTS", retryAfter?: number) =>
    new AppError(msg, 429, code, retryAfter ? { retryAfter } : undefined),

  payloadTooLarge: (msg: string, code = "PAYLOAD_TOO_LARGE") =>
    new AppError(msg, 413, code),

  serviceUnavailable: (msg: string, code = "SERVICE_UNAVAILABLE") =>
    new AppError(msg, 503, code),

  internal: (msg = "Something went wrong. Please try again.") =>
    new AppError(msg, 500, "INTERNAL_ERROR"),
};

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { AppError } from "../utils/AppError";
import { config } from "../config";

// ─── Global Error Handler ─────────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".");
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }

    res.status(422).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors,
    });
    return;
  }

  // Our own operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Multer upload limits (file too large, wrong field) -- without this they
  // surface as a 500, which tells the user nothing.
  if (err instanceof multer.MulterError) {
    const isTooLarge = err.code === "LIMIT_FILE_SIZE";
    res.status(isTooLarge ? 413 : 400).json({
      success: false,
      message: isTooLarge
        ? `Image is too large. Maximum size is ${config.upload.maxFileSizeMb} MB.`
        : `Upload failed: ${err.message}`,
      code: isTooLarge ? "PAYLOAD_TOO_LARGE" : "UPLOAD_ERROR",
    });
    return;
  }

  // Prisma unique constraint violations
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  ) {
    res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
      code: "DUPLICATE_ENTRY",
    });
    return;
  }

  // Unknown errors — never leak stack trace in production
  const message =
    config.nodeEnv === "development" && err instanceof Error
      ? err.message
      : "Something went wrong. Please try again.";

  if (config.nodeEnv !== "production" && err instanceof Error) {
    console.error("[Unhandled Error]", err);
  }

  res.status(500).json({
    success: false,
    message,
    code: "INTERNAL_ERROR",
  });
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND",
  });
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../config/prisma";
import { Errors } from "../utils/AppError";
import { UserRole } from "@prisma/client";

// ─── Extend Express Request ───────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ─── requireAuth ─────────────────────────────────────────────────────────────

/**
 * Validates the Bearer token and attaches the user to req.user.
 * Throws 401 if no/invalid token.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw Errors.unauthorized();
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    // Load fresh user from DB to catch disabled accounts
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw Errors.unauthorized("Account not found or has been deactivated.");
    }

    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(Errors.unauthorized("Invalid or expired token."));
    } else {
      next(err);
    }
  }
}

// ─── optionalAuth ────────────────────────────────────────────────────────────

/**
 * Same as requireAuth but never throws — public routes that can optionally
 * augment behaviour for logged-in users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    }
  } catch {
    // Ignore errors — token was invalid or expired, treat as guest
  }

  next();
}

// ─── requireRole ─────────────────────────────────────────────────────────────

/**
 * Must be used after requireAuth.
 * Throws 403 if the authenticated user does not have one of the allowed roles.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(Errors.forbidden());
    }

    next();
  };
}

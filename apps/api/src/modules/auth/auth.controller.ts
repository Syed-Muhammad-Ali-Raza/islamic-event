import { Request, Response, NextFunction } from "express";
import * as AuthService from "./auth.service";
import { sendSuccess } from "../../utils/response";

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.register(req.body);
    sendSuccess({ res, data: result, statusCode: 201, message: "Account created successfully." });
  } catch (err) {
    next(err);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.login(req.body);
    sendSuccess({ res, data: result, message: "Logged in successfully." });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const tokens = await AuthService.refreshTokens(refreshToken);
    sendSuccess({ res, data: tokens });
  } catch (err) {
    next(err);
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(_req: Request, res: Response): Promise<void> {
  // Stateless JWT — client discards tokens; server-side blocklist is a future Redis feature
  res.clearCookie("refreshToken");
  sendSuccess({ res, data: null, message: "Logged out successfully." });
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await AuthService.getMe(req.user!.id);
    sendSuccess({ res, data: user });
  } catch (err) {
    next(err);
  }
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.verifyEmail(req.body);
    sendSuccess({ res, data: result, message: "Email verified successfully." });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.resendVerification(req.body);
    sendSuccess({ res, data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.forgotPassword(req.body);
    sendSuccess({ res, data: result, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await AuthService.resetPassword(req.body);
    sendSuccess({ res, data: result, message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
}

import { Router } from "express";
import * as AuthController from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import {
  loginLimiter,
  passwordResetLimiter,
  registerLimiter,
  resetPasswordLimiter,
  sessionLimiter,
  verifyEmailLimiter,
} from "../../middleware/rateLimit.middleware";
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from "./auth.validation";

const router = Router();

// POST /api/v1/auth/register
router.post("/register", registerLimiter, validateBody(RegisterSchema), AuthController.register);

// POST /api/v1/auth/login
router.post("/login", loginLimiter, validateBody(LoginSchema), AuthController.login);

// POST /api/v1/auth/refresh
router.post("/refresh", sessionLimiter, validateBody(RefreshTokenSchema), AuthController.refresh);

// POST /api/v1/auth/logout
router.post("/logout", sessionLimiter, AuthController.logout);

// GET /api/v1/auth/me
router.get("/me", sessionLimiter, requireAuth, AuthController.me);

// PATCH /api/v1/auth/me
router.patch("/me", sessionLimiter, requireAuth, validateBody(UpdateProfileSchema), AuthController.updateProfile);

// POST /api/v1/auth/change-password
router.post(
  "/change-password",
  resetPasswordLimiter,
  requireAuth,
  validateBody(ChangePasswordSchema),
  AuthController.changePassword
);

// POST /api/v1/auth/verify-email
router.post("/verify-email", verifyEmailLimiter, validateBody(VerifyEmailSchema), AuthController.verifyEmail);

// POST /api/v1/auth/resend-verification
router.post(
  "/resend-verification",
  passwordResetLimiter,
  validateBody(ResendVerificationSchema),
  AuthController.resendVerification
);

// POST /api/v1/auth/forgot-password
router.post("/forgot-password", passwordResetLimiter, validateBody(ForgotPasswordSchema), AuthController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post("/reset-password", resetPasswordLimiter, validateBody(ResetPasswordSchema), AuthController.resetPassword);

export default router;

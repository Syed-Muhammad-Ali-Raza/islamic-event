import { Router } from "express";
import * as AuthController from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from "./auth.validation";

const router = Router();

// POST /api/v1/auth/register
router.post("/register", validateBody(RegisterSchema), AuthController.register);

// POST /api/v1/auth/login
router.post("/login", validateBody(LoginSchema), AuthController.login);

// POST /api/v1/auth/refresh
router.post("/refresh", validateBody(RefreshTokenSchema), AuthController.refresh);

// POST /api/v1/auth/logout
router.post("/logout", AuthController.logout);

// GET /api/v1/auth/me
router.get("/me", requireAuth, AuthController.me);

export default router;

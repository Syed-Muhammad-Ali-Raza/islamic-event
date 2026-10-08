import { Router } from "express";
import * as CategoryController from "./category.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/auth.middleware";

const router = Router();

// Public
router.get("/", CategoryController.listCategories);
router.get("/:slug", CategoryController.getCategory);

// Admin only
router.post("/", requireAuth, requireRole("ADMIN"), CategoryController.createCategory);
router.patch("/:id", requireAuth, requireRole("ADMIN"), CategoryController.updateCategory);
router.delete("/:id", requireAuth, requireRole("ADMIN"), CategoryController.deleteCategory);

export default router;

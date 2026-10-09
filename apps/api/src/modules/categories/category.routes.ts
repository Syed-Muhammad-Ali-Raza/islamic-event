import { Router } from "express";
import * as CategoryController from "./category.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { CreateCategorySchema, UpdateCategorySchema } from "./category.validation";

const router = Router();

// Public
router.get("/", CategoryController.listCategories);

// Admin only — must be registered before "/:slug"
router.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  CategoryController.listAllCategoriesAdmin
);

router.get("/:slug", CategoryController.getCategory);

// Admin only
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(CreateCategorySchema),
  CategoryController.createCategory
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(UpdateCategorySchema),
  CategoryController.updateCategory
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), CategoryController.deleteCategory);

export default router;

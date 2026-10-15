import { Router } from "express";
import * as CategoryController from "./category.controller";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { CreateCategorySchema, UpdateCategorySchema } from "./category.validation";

const router = Router();

// Public
router.get("/", CategoryController.listCategories);

// Super admin only — must be registered before "/:slug"
router.get(
  "/admin",
  requireAuth,
  requireSuperAdmin,
  CategoryController.listAllCategoriesAdmin
);

router.get("/:slug", CategoryController.getCategory);

// Super admin only
router.post(
  "/",
  requireAuth,
  requireSuperAdmin,
  validateBody(CreateCategorySchema),
  CategoryController.createCategory
);
router.patch(
  "/:id",
  requireAuth,
  requireSuperAdmin,
  validateBody(UpdateCategorySchema),
  CategoryController.updateCategory
);
router.delete("/:id", requireAuth, requireSuperAdmin, CategoryController.deleteCategory);

export default router;

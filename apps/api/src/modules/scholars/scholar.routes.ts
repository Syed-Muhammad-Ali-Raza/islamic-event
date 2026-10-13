import { Router } from "express";
import * as ScholarController from "./scholar.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { ScholarQuerySchema } from "./scholar.validation";

const router = Router();

// GET /api/v1/scholars  (public directory of Sunni & Shia scholars)
router.get("/", validateQuery(ScholarQuerySchema), ScholarController.listScholars);

// GET /api/v1/scholars/:sourceId
router.get("/:sourceId", ScholarController.getScholar);

export default router;

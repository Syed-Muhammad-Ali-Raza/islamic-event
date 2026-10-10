import { Router } from "express";
import * as DastarkhwanController from "./dastarkhwan.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { DastarkhwanQuerySchema } from "./dastarkhwan.validation";

const router = Router();

// GET /api/v1/dastarkhwans  (public directory of free food points)
router.get("/", validateQuery(DastarkhwanQuerySchema), DastarkhwanController.listDastarkhwans);

// GET /api/v1/dastarkhwans/:sourceId
router.get("/:sourceId", DastarkhwanController.getDastarkhwan);

export default router;

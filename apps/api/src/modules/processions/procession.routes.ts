import { Router } from "express";
import * as ProcessionController from "./procession.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { ProcessionQuerySchema } from "./procession.validation";

const router = Router();

// GET /api/v1/processions  (public Muharram/Safar jaloos route details)
router.get("/", validateQuery(ProcessionQuerySchema), ProcessionController.listProcessions);

// GET /api/v1/processions/:sourceId
router.get("/:sourceId", ProcessionController.getProcession);

export default router;

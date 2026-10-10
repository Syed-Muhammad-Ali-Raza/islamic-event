import { Router } from "express";
import * as DarbarController from "./darbar.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { DarbarQuerySchema } from "./darbar.validation";

const router = Router();

// GET /api/v1/darbars  (public directory of Sufi shrines)
router.get("/", validateQuery(DarbarQuerySchema), DarbarController.listDarbars);

// GET /api/v1/darbars/:sourceId
router.get("/:sourceId", DarbarController.getDarbar);

export default router;

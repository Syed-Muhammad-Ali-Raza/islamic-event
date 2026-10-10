import { Router } from "express";
import * as UrsDateController from "./ursDate.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { UrsDateQuerySchema } from "./ursDate.validation";

const router = Router();

// GET /api/v1/urs-dates  (public Urs calendar for major Sufi shrines)
router.get("/", validateQuery(UrsDateQuerySchema), UrsDateController.listUrsDates);

// GET /api/v1/urs-dates/:sourceId
router.get("/:sourceId", UrsDateController.getUrsDate);

export default router;

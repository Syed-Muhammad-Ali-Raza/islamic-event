import { Router } from "express";
import * as MelaController from "./mela.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { MelaQuerySchema } from "./mela.validation";

const router = Router();

// GET /api/v1/melas  (public directory of melas / festivals)
router.get("/", validateQuery(MelaQuerySchema), MelaController.listMelas);

// GET /api/v1/melas/:sourceId
router.get("/:sourceId", MelaController.getMela);

export default router;

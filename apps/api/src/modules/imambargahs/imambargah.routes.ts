import { Router } from "express";
import * as ImambargahController from "./imambargah.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { ImambargahQuerySchema } from "./imambargah.validation";

const router = Router();

// GET /api/v1/imambargahs  (public directory of imambargahs / karbalas)
router.get("/", validateQuery(ImambargahQuerySchema), ImambargahController.listImambargahs);

// GET /api/v1/imambargahs/:sourceId
router.get("/:sourceId", ImambargahController.getImambargah);

export default router;

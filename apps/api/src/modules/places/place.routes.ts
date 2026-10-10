import { Router } from "express";
import * as PlaceController from "./place.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { PlaceQuerySchema } from "./place.validation";

const router = Router();

// GET /api/v1/places  (public directory of Pakistani places)
router.get("/", validateQuery(PlaceQuerySchema), PlaceController.listPlaces);

// GET /api/v1/places/:sourceId
router.get("/:sourceId", PlaceController.getPlace);

export default router;

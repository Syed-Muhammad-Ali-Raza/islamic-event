import { Router } from "express";
import * as CharityController from "./charity.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { CharityQuerySchema } from "./charity.validation";

const router = Router();

// GET /api/v1/charities/facets  (distinct country/province/city for dropdowns)
router.get("/facets", CharityController.listCharityFacets);

// GET /api/v1/charities  (public charity directory)
router.get("/", validateQuery(CharityQuerySchema), CharityController.listCharities);

// GET /api/v1/charities/:sourceId
router.get("/:sourceId", CharityController.getCharity);

export default router;

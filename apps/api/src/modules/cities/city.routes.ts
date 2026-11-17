import { Router } from "express";
import * as CityController from "./city.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { CityQuerySchema } from "./city.validation";

const router = Router();

// Public
router.get("/", validateQuery(CityQuerySchema), CityController.listCities);
router.get("/:slug", CityController.getCity);

export default router;

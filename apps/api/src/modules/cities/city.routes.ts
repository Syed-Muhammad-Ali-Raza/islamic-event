import { Router } from "express";
import * as CityController from "./city.controller";

const router = Router();

// Public
router.get("/", CityController.listCities);
router.get("/:slug", CityController.getCity);

export default router;

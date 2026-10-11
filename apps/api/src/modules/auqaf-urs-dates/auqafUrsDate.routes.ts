import { Router } from "express";
import * as AuqafUrsDateController from "./auqafUrsDate.controller";
import { validateQuery } from "../../middleware/validate.middleware";
import { AuqafUrsDateQuerySchema } from "./auqafUrsDate.validation";

const router = Router();

// GET /api/v1/auqaf-urs-dates  (public Punjab Auqaf urs calendar)
router.get(
  "/",
  validateQuery(AuqafUrsDateQuerySchema),
  AuqafUrsDateController.listAuqafUrsDates
);

export default router;

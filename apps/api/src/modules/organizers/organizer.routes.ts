import { Router } from "express";
import * as OrganizerController from "./organizer.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { CreateOrganizerSchema } from "./organizer.validation";

const router = Router();

router.get("/", OrganizerController.listOrganizers);
router.get("/:slug", OrganizerController.getOrganizer);
router.post("/", requireAuth, validateBody(CreateOrganizerSchema), OrganizerController.createOrganizer);
router.patch("/:id", requireAuth, OrganizerController.updateOrganizer);

export default router;

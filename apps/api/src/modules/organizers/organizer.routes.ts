import { Router } from "express";
import * as OrganizerController from "./organizer.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", OrganizerController.listOrganizers);
router.get("/:slug", OrganizerController.getOrganizer);
router.post("/", requireAuth, OrganizerController.createOrganizer);
router.patch("/:id", requireAuth, OrganizerController.updateOrganizer);

export default router;

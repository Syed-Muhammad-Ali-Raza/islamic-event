import { Router } from "express";
import * as PlaceController from "./place.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { PlaceQuerySchema, CreatePlaceSchema, UpdatePlaceSchema } from "./place.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("place");

// GET /api/v1/places  (public directory of Pakistani places)
router.get("/", validateQuery(PlaceQuerySchema), PlaceController.listPlaces);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreatePlaceSchema), PlaceController.createPlace);
router.patch("/:id", requireAuth, validateBody(UpdatePlaceSchema), PlaceController.updatePlace);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/places/:sourceId
router.get("/:sourceId", PlaceController.getPlace);

export default router;

import { Router } from "express";
import * as CharityController from "./charity.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { CharityQuerySchema, CreateCharitySchema, UpdateCharitySchema } from "./charity.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("charity");

// GET /api/v1/charities/facets  (distinct country/province/city for dropdowns)
router.get("/facets", CharityController.listCharityFacets);

// GET /api/v1/charities  (public charity directory)
router.get("/", validateQuery(CharityQuerySchema), CharityController.listCharities);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateCharitySchema), CharityController.createCharity);
router.patch("/:id", requireAuth, validateBody(UpdateCharitySchema), CharityController.updateCharity);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/charities/:sourceId
router.get("/:sourceId", CharityController.getCharity);

export default router;

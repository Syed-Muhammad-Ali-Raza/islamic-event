import { Router } from "express";
import * as UrsDateController from "./ursDate.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { UrsDateQuerySchema, CreateUrsDateSchema, UpdateUrsDateSchema } from "./ursDate.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("ursDate");

// GET /api/v1/urs-dates  (public Urs calendar for major Sufi shrines)
router.get("/", validateQuery(UrsDateQuerySchema), UrsDateController.listUrsDates);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateUrsDateSchema), UrsDateController.createUrsDate);
router.patch("/:id", requireAuth, validateBody(UpdateUrsDateSchema), UrsDateController.updateUrsDate);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/urs-dates/:sourceId
router.get("/:sourceId", UrsDateController.getUrsDate);

export default router;

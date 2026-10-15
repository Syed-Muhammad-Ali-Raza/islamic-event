import { Router } from "express";
import * as ProcessionController from "./procession.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { ProcessionQuerySchema, CreateProcessionSchema, UpdateProcessionSchema } from "./procession.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("procession");

// GET /api/v1/processions  (public Muharram/Safar jaloos route details)
router.get("/", validateQuery(ProcessionQuerySchema), ProcessionController.listProcessions);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateProcessionSchema), ProcessionController.createProcession);
router.patch("/:id", requireAuth, validateBody(UpdateProcessionSchema), ProcessionController.updateProcession);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/processions/:sourceId
router.get("/:sourceId", ProcessionController.getProcession);

export default router;

import { Router } from "express";
import * as ScholarController from "./scholar.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { ScholarQuerySchema, CreateScholarSchema, UpdateScholarSchema } from "./scholar.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("scholar");

// GET /api/v1/scholars  (public directory of Sunni & Shia scholars)
router.get("/", validateQuery(ScholarQuerySchema), ScholarController.listScholars);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateScholarSchema), ScholarController.createScholar);
router.patch("/:id", requireAuth, validateBody(UpdateScholarSchema), ScholarController.updateScholar);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/scholars/:sourceId
router.get("/:sourceId", ScholarController.getScholar);

export default router;

import { Router } from "express";
import * as DastarkhwanController from "./dastarkhwan.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { DastarkhwanQuerySchema, CreateDastarkhwanSchema, UpdateDastarkhwanSchema } from "./dastarkhwan.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("dastarkhwan");

// GET /api/v1/dastarkhwans  (public directory of free food points)
router.get("/", validateQuery(DastarkhwanQuerySchema), DastarkhwanController.listDastarkhwans);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
// POST creates a row: PENDING for regular users, APPROVED for super admins.
router.post("/", requireAuth, validateBody(CreateDastarkhwanSchema), DastarkhwanController.createDastarkhwan);
router.patch("/:id", requireAuth, validateBody(UpdateDastarkhwanSchema), DastarkhwanController.updateDastarkhwan);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/dastarkhwans/:sourceId  (APPROVED + active only)
router.get("/:sourceId", DastarkhwanController.getDastarkhwan);

export default router;

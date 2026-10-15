import { Router } from "express";
import * as ApprovalsController from "./approvals.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { ApprovalsQuerySchema } from "./approvals.validation";

const router = Router();

// GET /api/v1/approvals
// Moderation queue across all nine directory modules.
// Scope (computed server-side): super admin sees everything; org OWNER/ADMIN
// see their organizations' rows plus their own submissions; everyone else
// sees only what they submitted. Approve/reject happen on the per-module
// routes (POST /:module/:id/approve|reject) with a server-side re-check.
router.get("/", requireAuth, validateQuery(ApprovalsQuerySchema), ApprovalsController.listApprovals);

export default router;

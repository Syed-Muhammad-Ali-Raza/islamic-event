import { Router } from "express";
import * as DarbarController from "./darbar.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { DarbarQuerySchema, CreateDarbarSchema, UpdateDarbarSchema } from "./darbar.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("darbar");

// GET /api/v1/darbars  (public directory of Sufi shrines)
router.get("/", validateQuery(DarbarQuerySchema), DarbarController.listDarbars);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateDarbarSchema), DarbarController.createDarbar);
router.patch("/:id", requireAuth, validateBody(UpdateDarbarSchema), DarbarController.updateDarbar);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/darbars/:sourceId
router.get("/:sourceId", DarbarController.getDarbar);

export default router;

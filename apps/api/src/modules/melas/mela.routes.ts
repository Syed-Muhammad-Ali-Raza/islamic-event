import { Router } from "express";
import * as MelaController from "./mela.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { MelaQuerySchema, CreateMelaSchema, UpdateMelaSchema } from "./mela.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("mela");

// GET /api/v1/melas  (public directory of melas / festivals)
router.get("/", validateQuery(MelaQuerySchema), MelaController.listMelas);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateMelaSchema), MelaController.createMela);
router.patch("/:id", requireAuth, validateBody(UpdateMelaSchema), MelaController.updateMela);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/melas/:sourceId
router.get("/:sourceId", MelaController.getMela);

export default router;

import { Router } from "express";
import * as ImambargahController from "./imambargah.controller";
import { validateQuery, validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { ImambargahQuerySchema, CreateImambargahSchema, UpdateImambargahSchema } from "./imambargah.validation";
import { RejectSubmissionSchema } from "../approvals/approvals.validation";
import { moderationControllers } from "../approvals/approvals.controller";

const router = Router();
const moderation = moderationControllers("imambargah");

// GET /api/v1/imambargahs  (public directory of Shia sacred sites)
router.get("/", validateQuery(ImambargahQuerySchema), ImambargahController.listImambargahs);

// ─── Submissions (auth) ──────────────────────────────────────────────────────
router.post("/", requireAuth, validateBody(CreateImambargahSchema), ImambargahController.createImambargah);
router.patch("/:id", requireAuth, validateBody(UpdateImambargahSchema), ImambargahController.updateImambargah);
router.post("/:id/approve", requireAuth, moderation.approve);
router.post("/:id/reject", requireAuth, validateBody(RejectSubmissionSchema), moderation.reject);

// GET /api/v1/imambargahs/:sourceId  (APPROVED + active only)
router.get("/:sourceId", ImambargahController.getImambargah);

export default router;

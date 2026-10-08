import { Router } from "express";
import * as UploadController from "./upload.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { upload } from "./upload.service";

const router = Router();

// POST /api/v1/upload/poster
router.post("/poster", requireAuth, upload.single("poster"), UploadController.uploadPoster);

export default router;

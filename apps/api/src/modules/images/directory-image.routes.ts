import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import { upload } from "../upload/upload.service";
import * as ImageController from "./directory-image.controller";
import {
  ListDirectoryImagesSchema,
  UploadDirectoryImageSchema,
} from "./directory-image.validation";

// Mounted under /api/v1/admin/images. The parent admin router already requires
// auth + super admin (SUPER_ADMIN or legacy ADMIN).
const router = Router();

router.get("/", validateQuery(ListDirectoryImagesSchema), ImageController.listImages);
router.post("/", upload.single("image"), validateBody(UploadDirectoryImageSchema), ImageController.uploadDirectoryImage);
router.delete("/:entityType/:entityId", ImageController.removeDirectoryImage);

export default router;

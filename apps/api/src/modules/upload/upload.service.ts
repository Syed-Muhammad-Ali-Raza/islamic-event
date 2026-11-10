import multer from "multer";
import path from "path";
import { Request } from "express";
import { config } from "../../config";
import { Errors } from "../../utils/AppError";
import { uploadImage } from "./storage.service";

// ─── Multer: memory storage + allow-list ─────────────────────────────────────

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedExt = config.upload.allowedExtensions.includes(ext as never);
  const isAllowedMime = config.upload.allowedMimeTypes.includes(file.mimetype as never);

  if (isAllowedExt && isAllowedMime) {
    cb(null, true);
  } else {
    // AppError (not a bare Error) so the handler answers 400 with a code
    // instead of a 500.
    cb(Errors.badRequest("Only JPG, PNG, and WEBP images are allowed.", "INVALID_FILE_TYPE"));
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
  },
});

// ─── Upload to the configured image backend (S3-compatible or Cloudinary) ────

export { deleteImage, imageProvider, isStorageConfigured } from "./storage.service";
export type { ImageProvider, UploadedImage } from "./storage.service";

export function uploadEventPoster(buffer: Buffer, folder = "events") {
  return uploadImage(buffer, folder);
}

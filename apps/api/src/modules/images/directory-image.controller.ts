import { Request, Response, NextFunction } from "express";
import { deleteImage, uploadImage } from "../upload/storage.service";
import { Errors } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";
import {
  clearDirectoryImage,
  imageFolder,
  getImageTarget,
  listDirectoryImages,
  setDirectoryImage,
} from "./directory-image.service";
import {
  ImageParamsSchema,
  ListDirectoryImagesSchema,
  UploadDirectoryImageSchema,
} from "./directory-image.validation";

export async function listImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { entityType, q } = ListDirectoryImagesSchema.parse(req.query);
    const items = await listDirectoryImages(entityType, q);
    sendSuccess({ res, data: items });
  } catch (err) {
    next(err);
  }
}

export async function uploadDirectoryImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw Errors.badRequest("No image file provided.", "MISSING_FILE");
    }

    const { entityType, entityId } = UploadDirectoryImageSchema.parse(req.body);

    // Resolve the target first so a bad id never leaves an orphaned object.
    const target = await getImageTarget(entityType, entityId);
    if (!target) throw Errors.notFound("Directory entry");

    const result = await uploadImage(req.file.buffer, imageFolder(entityType));
    await setDirectoryImage(entityType, entityId, result.url, result.publicId);

    if (target.imagePublicId && target.imagePublicId !== result.publicId) {
      await deleteImage(target.imagePublicId);
    }

    sendSuccess({
      res,
      data: { ...result, entityType, entityId },
      statusCode: 201,
      message: "Image uploaded successfully.",
    });
  } catch (err) {
    next(err);
  }
}

export async function removeDirectoryImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entityType, entityId } = ImageParamsSchema.parse(req.params);
    const target = await getImageTarget(entityType, entityId);
    if (!target) throw Errors.notFound("Directory entry");

    await clearDirectoryImage(entityType, entityId);
    if (target.imagePublicId) await deleteImage(target.imagePublicId);

    sendSuccess({ res, data: null, message: "Image removed successfully." });
  } catch (err) {
    next(err);
  }
}

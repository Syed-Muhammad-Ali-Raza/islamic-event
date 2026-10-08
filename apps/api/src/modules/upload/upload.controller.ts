import { Request, Response, NextFunction } from "express";
import { uploadEventPoster } from "./upload.service";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { sendSuccess } from "../../utils/response";

export async function uploadPoster(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw Errors.badRequest("No image file provided.", "MISSING_FILE");
    }

    const result = await uploadEventPoster(req.file.buffer);

    // If an event ID was provided, update the event directly
    const { eventId } = req.body as { eventId?: string };
    if (eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw Errors.notFound("Event");
      if (event.createdById !== req.user!.id && req.user!.role !== "ADMIN") {
        throw Errors.forbidden();
      }

      await prisma.event.update({
        where: { id: eventId },
        data: { posterUrl: result.url, posterPublicId: result.publicId },
      });
    }

    sendSuccess({ res, data: result, statusCode: 201, message: "Image uploaded successfully." });
  } catch (err) {
    next(err);
  }
}

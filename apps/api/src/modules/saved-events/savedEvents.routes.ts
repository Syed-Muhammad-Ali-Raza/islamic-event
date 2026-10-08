import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import * as SavedService from "./savedEvents.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

// POST /api/v1/events/:id/save
router.post("/:id/save", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = await SavedService.saveEvent(req.user!.id, req.params.id);
    sendSuccess({ res, data: saved, statusCode: 201, message: "Event saved." });
  } catch (err) { next(err); }
});

// DELETE /api/v1/events/:id/save
router.delete("/:id/save", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await SavedService.unsaveEvent(req.user!.id, req.params.id);
    sendSuccess({ res, data: null, message: "Event removed from saved." });
  } catch (err) { next(err); }
});

// GET /api/v1/users/me/saved-events  — this route is registered under /users in app.ts
export async function listSavedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await SavedService.getSavedEvents(req.user!.id, page, limit);
    sendPaginated({ res, data: result.items, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export default router;

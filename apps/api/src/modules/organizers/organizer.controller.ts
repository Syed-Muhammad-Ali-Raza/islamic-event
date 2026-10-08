import { Request, Response, NextFunction } from "express";
import * as OrganizerService from "./organizer.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listOrganizers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await OrganizerService.listOrganizers(page, limit, req.query.search as string | undefined);
    sendPaginated({ res, data: result.organizers, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.getOrganizerBySlug(req.params.slug);
    sendSuccess({ res, data: organizer });
  } catch (err) { next(err); }
}

export async function createOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.createOrganizer(req.body, req.user!.id);
    sendSuccess({ res, data: organizer, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function updateOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.updateOrganizer(req.params.id, req.body, req.user!.id, req.user!.role);
    sendSuccess({ res, data: organizer });
  } catch (err) { next(err); }
}

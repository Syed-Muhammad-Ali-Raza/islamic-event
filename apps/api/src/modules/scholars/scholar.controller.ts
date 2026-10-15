import { Request, Response, NextFunction } from "express";
import * as ScholarService from "./scholar.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listScholars(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await ScholarService.listScholars(req.query as never, page, limit);
    sendPaginated({ res, data: result.scholars, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getScholar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scholar = await ScholarService.getScholar(req.params.sourceId);
    sendSuccess({ res, data: scholar });
  } catch (err) { next(err); }
}

export async function createScholar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scholar = await ScholarService.createScholar(req.body, req.user!);
    sendSuccess({ res, data: scholar, statusCode: 201, message: "Scholar submitted." });
  } catch (err) { next(err); }
}

export async function updateScholar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scholar = await ScholarService.updateScholar(req.params.id, req.body, req.user!);
    sendSuccess({ res, data: scholar, message: "Scholar updated." });
  } catch (err) { next(err); }
}

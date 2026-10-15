import { Request, Response, NextFunction } from "express";
import * as DastarkhwanService from "./dastarkhwan.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listDastarkhwans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await DastarkhwanService.listDastarkhwans(req.query as never, page, limit);
    sendPaginated({ res, data: result.points, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getDastarkhwan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const point = await DastarkhwanService.getDastarkhwan(req.params.sourceId);
    sendSuccess({ res, data: point });
  } catch (err) { next(err); }
}

export async function createDastarkhwan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const point = await DastarkhwanService.createDastarkhwan(req.body, req.user!);
    sendSuccess({ res, data: point, statusCode: 201, message: "Dastarkhwan point submitted." });
  } catch (err) { next(err); }
}

export async function updateDastarkhwan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const point = await DastarkhwanService.updateDastarkhwan(req.params.id, req.body, req.user!);
    sendSuccess({ res, data: point, message: "Dastarkhwan point updated." });
  } catch (err) { next(err); }
}

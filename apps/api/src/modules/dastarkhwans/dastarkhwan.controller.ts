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

import { Request, Response, NextFunction } from "express";
import * as ProcessionService from "./procession.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listProcessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await ProcessionService.listProcessions(req.query as never, page, limit);
    sendPaginated({ res, data: result.processions, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getProcession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const p = await ProcessionService.getProcession(req.params.sourceId);
    sendSuccess({ res, data: p });
  } catch (err) { next(err); }
}

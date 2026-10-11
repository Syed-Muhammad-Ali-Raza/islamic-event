import { Request, Response, NextFunction } from "express";
import * as AuqafUrsDateService from "./auqafUrsDate.service";
import { sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listAuqafUrsDates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await AuqafUrsDateService.listAuqafUrsDates(req.query as never, page, limit);
    sendPaginated({ res, data: result.dates, page, limit, total: result.total });
  } catch (err) { next(err); }
}

import { Request, Response, NextFunction } from "express";
import * as ImambargahService from "./imambargah.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listImambargahs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await ImambargahService.listImambargahs(req.query as never, page, limit);
    sendPaginated({ res, data: result.points, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getImambargah(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const point = await ImambargahService.getImambargah(req.params.sourceId);
    sendSuccess({ res, data: point });
  } catch (err) { next(err); }
}

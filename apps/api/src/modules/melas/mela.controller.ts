import { Request, Response, NextFunction } from "express";
import * as MelaService from "./mela.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listMelas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await MelaService.listMelas(req.query as never, page, limit);
    sendPaginated({ res, data: result.melas, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getMela(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mela = await MelaService.getMela(req.params.sourceId);
    sendSuccess({ res, data: mela });
  } catch (err) { next(err); }
}

export async function createMela(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mela = await MelaService.createMela(req.body, req.user!);
    sendSuccess({ res, data: mela, statusCode: 201, message: "Mela submitted." });
  } catch (err) { next(err); }
}

export async function updateMela(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mela = await MelaService.updateMela(req.params.id, req.body, req.user!);
    sendSuccess({ res, data: mela, message: "Mela updated." });
  } catch (err) { next(err); }
}

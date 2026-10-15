import { Request, Response, NextFunction } from "express";
import * as DarbarService from "./darbar.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listDarbars(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await DarbarService.listDarbars(req.query as never, page, limit);
    sendPaginated({ res, data: result.darbars, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getDarbar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const darbar = await DarbarService.getDarbar(req.params.sourceId);
    sendSuccess({ res, data: darbar });
  } catch (err) { next(err); }
}

export async function createDarbar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const darbar = await DarbarService.createDarbar(req.body, req.user!);
    sendSuccess({ res, data: darbar, statusCode: 201, message: "Darbar submitted." });
  } catch (err) { next(err); }
}

export async function updateDarbar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const darbar = await DarbarService.updateDarbar(req.params.id, req.body, req.user!);
    sendSuccess({ res, data: darbar, message: "Darbar updated." });
  } catch (err) { next(err); }
}

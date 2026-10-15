import { Request, Response, NextFunction } from "express";
import * as UrsDateService from "./ursDate.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listUrsDates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await UrsDateService.listUrsDates(req.query as never, page, limit);
    sendPaginated({ res, data: result.dates, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getUrsDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = await UrsDateService.getUrsDate(req.params.sourceId);
    sendSuccess({ res, data: date });
  } catch (err) { next(err); }
}

export async function createUrsDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = await UrsDateService.createUrsDate(req.body, req.user!);
    sendSuccess({ res, data: date, statusCode: 201, message: "Urs date submitted." });
  } catch (err) { next(err); }
}

export async function updateUrsDate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = await UrsDateService.updateUrsDate(req.params.id, req.body, req.user!);
    sendSuccess({ res, data: date, message: "Urs date updated." });
  } catch (err) { next(err); }
}

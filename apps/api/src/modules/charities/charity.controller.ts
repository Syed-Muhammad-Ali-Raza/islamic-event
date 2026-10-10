import { Request, Response, NextFunction } from "express";
import * as CharityService from "./charity.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listCharities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await CharityService.listCharities(req.query as never, page, limit);
    sendPaginated({ res, data: result.charities, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getCharity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const c = await CharityService.getCharity(req.params.sourceId);
    sendSuccess({ res, data: c });
  } catch (err) { next(err); }
}

export async function listCharityFacets(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facets = await CharityService.listCharityFacets();
    sendSuccess({ res, data: facets });
  } catch (err) { next(err); }
}

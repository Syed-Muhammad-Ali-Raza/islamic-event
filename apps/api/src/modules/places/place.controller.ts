import { Request, Response, NextFunction } from "express";
import * as PlaceService from "./place.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await PlaceService.listPlaces(req.query as never, page, limit);
    sendPaginated({ res, data: result.places, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getPlace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const place = await PlaceService.getPlace(req.params.sourceId);
    sendSuccess({ res, data: place });
  } catch (err) { next(err); }
}

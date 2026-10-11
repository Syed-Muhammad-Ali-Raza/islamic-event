import { Request, Response, NextFunction } from "express";
import * as CityService from "./city.service";
import { sendSuccess } from "../../utils/response";

export async function listCities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cities = await CityService.listCitiesWithEvents();
    sendSuccess({ res, data: cities });
  } catch (err) {
    next(err);
  }
}

export async function getCity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const city = await CityService.getCityBySlug(req.params.slug);
    sendSuccess({ res, data: city });
  } catch (err) {
    next(err);
  }
}

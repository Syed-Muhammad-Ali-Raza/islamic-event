import { Request, Response, NextFunction } from "express";
import * as PeopleService from "./people.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listPeople(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await PeopleService.listPeople(page, limit, req.query.search as string | undefined);
    sendPaginated({ res, data: result.people, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getPerson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const person = await PeopleService.getPersonById(req.params.id);
    sendSuccess({ res, data: person });
  } catch (err) { next(err); }
}

export async function createPerson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const person = await PeopleService.createPerson(req.body);
    sendSuccess({ res, data: person, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function updatePerson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const person = await PeopleService.updatePerson(req.params.id, req.body);
    sendSuccess({ res, data: person });
  } catch (err) { next(err); }
}

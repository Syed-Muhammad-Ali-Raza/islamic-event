import { Request, Response, NextFunction } from "express";
import * as EventService from "./event.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { events, page, limit, total } = await EventService.listEvents(req.query as never, req.user?.id);
    sendPaginated({ res, data: events, page, limit, total });
  } catch (err) { next(err); }
}

export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await EventService.getEventBySlug(req.params.slug);
    const rsvps = await EventService.getRsvpState(event.id, req.user?.id);
    sendSuccess({ res, data: { ...event, rsvps } });
  } catch (err) { next(err); }
}

export async function setRsvp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await EventService.setRsvp(
      req.params.id,
      req.user!.id,
      req.body.type as "INTERESTED" | "ATTENDING"
    );
    sendSuccess({ res, data: result, message: "RSVP saved." });
  } catch (err) { next(err); }
}

export async function removeRsvp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await EventService.removeRsvp(req.params.id, req.user!.id);
    sendSuccess({ res, data: result, message: "RSVP removed." });
  } catch (err) { next(err); }
}

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { event, possibleDuplicate } = await EventService.createEvent(req.body, req.user!.id);
    sendSuccess({
      res,
      data: { event, possibleDuplicate },
      statusCode: 201,
      message: "Event submitted for review.",
    });
  } catch (err) { next(err); }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await EventService.updateEvent(req.params.id, req.body, req.user!.id, req.user!.role);
    sendSuccess({ res, data: event });
  } catch (err) { next(err); }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await EventService.deleteEvent(req.params.id, req.user!.id, req.user!.role);
    sendSuccess({ res, data: null, message: "Event cancelled." });
  } catch (err) { next(err); }
}

export async function getMyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const result = await EventService.getMyEvents(req.user!.id, page, limit);
    sendPaginated({ res, data: result.events, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function reportEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await EventService.reportEvent(req.params.id, req.user!.id, req.body);
    sendSuccess({ res, data: report, statusCode: 201, message: "Report submitted. Thank you." });
  } catch (err) { next(err); }
}

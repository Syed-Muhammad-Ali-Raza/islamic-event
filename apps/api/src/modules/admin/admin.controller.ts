import { Request, Response, NextFunction } from "express";
import * as AdminService from "./admin.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await AdminService.getDashboardStats();
    sendSuccess({ res, data: stats });
  } catch (err) { next(err); }
}

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await AdminService.adminListEvents(page, limit, req.query.status as string | undefined);
    sendPaginated({ res, data: result.events, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function approveEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await AdminService.approveEvent(req.params.id);
    sendSuccess({ res, data: event, message: "Event approved." });
  } catch (err) { next(err); }
}

export async function rejectEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await AdminService.rejectEvent(req.params.id, req.body.reason);
    sendSuccess({ res, data: event, message: "Event rejected." });
  } catch (err) { next(err); }
}

export async function cancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await AdminService.cancelEvent(req.params.id);
    sendSuccess({ res, data: event, message: "Event cancelled." });
  } catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await AdminService.adminListUsers(page, limit);
    sendPaginated({ res, data: result.users, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await AdminService.updateUserStatus(req.params.id, req.body.isActive);
    sendSuccess({ res, data: user, message: "User status updated." });
  } catch (err) { next(err); }
}

export async function listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await AdminService.adminListReports(page, limit);
    sendPaginated({ res, data: result.reports, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function resolveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await AdminService.resolveReport(req.params.id, req.body.status);
    sendSuccess({ res, data: report, message: "Report updated." });
  } catch (err) { next(err); }
}

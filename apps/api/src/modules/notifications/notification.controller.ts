import { Request, Response, NextFunction } from "express";
import * as NotificationService from "./notification.service";
import { sendSuccess } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const result = await NotificationService.listNotifications(req.user!.id, page, limit);
    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await NotificationService.getUnreadCount(req.user!.id);
    sendSuccess({ res, data: result });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await NotificationService.markRead(req.user!.id, req.params.id);
    sendSuccess({ res, data: notification, message: "Notification marked as read." });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await NotificationService.markAllRead(req.user!.id);
    sendSuccess({ res, data: result, message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
}

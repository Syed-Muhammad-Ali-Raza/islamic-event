import { Request, Response, NextFunction } from "express";
import * as OrganizerService from "./organizer.service";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";
import { Errors } from "../../utils/AppError";
import { assertSuperAdmin } from "../../utils/permissions";

export async function listOrganizers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    // Admin surfaces need to see (and re-activate) deactivated organizations;
    // that view is super-admin only. Regular callers get the public list.
    const includeInactive = req.query.includeInactive === "true";
    if (includeInactive) {
      if (!req.user) throw Errors.unauthorized();
      assertSuperAdmin(req.user);
    }
    const result = await OrganizerService.listOrganizers(
      page,
      limit,
      req.query.search as string | undefined,
      includeInactive
    );
    sendPaginated({ res, data: result.organizers, page, limit, total: result.total });
  } catch (err) { next(err); }
}

export async function getOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.getOrganizerBySlug(req.params.slug);
    sendSuccess({ res, data: organizer });
  } catch (err) { next(err); }
}

export async function createOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.createOrganizer(req.body, req.user);
    sendSuccess({ res, data: organizer, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function updateOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.updateOrganizer(req.params.id, req.body, req.user);
    sendSuccess({ res, data: organizer });
  } catch (err) { next(err); }
}

export async function deactivateOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.setOrganizerActive(req.params.id, false, req.user);
    sendSuccess({ res, data: organizer, message: "Organization deactivated" });
  } catch (err) { next(err); }
}

export async function activateOrganizer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const organizer = await OrganizerService.setOrganizerActive(req.params.id, true, req.user);
    sendSuccess({ res, data: organizer, message: "Organization activated" });
  } catch (err) { next(err); }
}

// ─── Members ────────────────────────────────────────────────────────────────

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await OrganizerService.listMembers(req.params.id, req.user);
    sendSuccess({ res, data: members });
  } catch (err) { next(err); }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await OrganizerService.addMember(req.params.id, req.body, req.user);
    sendSuccess({ res, data: member, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await OrganizerService.updateMemberRole(
      req.params.id,
      req.params.userId,
      req.body.role,
      req.user
    );
    sendSuccess({ res, data: member });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await OrganizerService.removeMember(req.params.id, req.params.userId, req.user);
    sendSuccess({ res, data: { removed: true } });
  } catch (err) { next(err); }
}

// ─── "Me" endpoints ─────────────────────────────────────────────────────────

export async function listMyOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberships = await OrganizerService.listMyOrganizations(req.user!.id);
    sendSuccess({ res, data: memberships });
  } catch (err) { next(err); }
}

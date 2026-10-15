import { OrgRole, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { Errors } from "./AppError";

// ─── Shared permission helpers ──────────────────────────────────────────────
// Single source of truth for role checks across modules. Route guards use the
// requireSuperAdmin middleware (auth.middleware.ts); services use these
// functions for defense-in-depth and for org-scoped decisions.

/** Anything carrying a user's platform role (req.user, a Prisma user row, …). */
export type PermissionUser = { id: string; role: UserRole } | null | undefined;

/**
 * Platform-wide admin check.
 * SUPER_ADMIN is the top role; legacy ADMIN is deliberately treated the same
 * so pre-existing accounts keep every admin permission (see migration
 * 20261015081220_promote_admins_to_super_admin).
 */
export function isSuperAdmin(user: PermissionUser): boolean {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
}

/**
 * Throws 403 unless the caller is a super admin (SUPER_ADMIN or legacy ADMIN).
 * Route guards use the requireSuperAdmin middleware instead; this is for
 * checks inside service functions.
 */
export function assertSuperAdmin(user: PermissionUser): void {
  if (!isSuperAdmin(user)) {
    throw Errors.forbidden("Super admin access required.");
  }
}

/** The caller's role inside one organization, or null when not a member. */
export async function getOrgRole(
  userId: string,
  organizerId: string
): Promise<OrgRole | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, organizerId },
    select: { role: true },
  });
  return membership?.role ?? null;
}

/**
 * Who may SUBMIT content for an organization: any member (OWNER, ADMIN or
 * EDITOR) or a super admin. Content submitted without an organization is a
 * separate path (events) and does not use this helper.
 */
export async function canSubmitForOrg(
  user: PermissionUser,
  organizerId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (!user) return false;
  return (await getOrgRole(user.id, organizerId)) !== null;
}

/**
 * Who may APPROVE/REJECT submissions for an organization: org OWNER or ADMIN,
 * or a super admin. EDITORs can never approve.
 */
export async function canApproveForOrg(
  user: PermissionUser,
  organizerId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (!user) return false;
  const role = await getOrgRole(user.id, organizerId);
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Org-level guard for member-management reads: super admins always pass;
 * within an organization only OWNER and ADMIN may manage/view members.
 * EDITORs are blocked.
 */
export async function canManageOrgMembers(
  user: PermissionUser,
  organizerId: string
): Promise<boolean> {
  if (isSuperAdmin(user)) return true;
  if (!user) return false;
  const role = await getOrgRole(user.id, organizerId);
  return role === "OWNER" || role === "ADMIN";
}

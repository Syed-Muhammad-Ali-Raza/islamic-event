import { OrgRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { generateSlug } from "../../utils/helpers";
import {
  PermissionUser,
  assertSuperAdmin,
  canManageOrgMembers,
} from "../../utils/permissions";

const MEMBER_USER_SELECT = { id: true, name: true, email: true } as const;

export async function listOrganizers(
  page: number,
  limit: number,
  search?: string,
  includeInactive = false
) {
  const skip = (page - 1) * limit;
  const where = {
    // includeInactive is only reachable by super admins (checked in the
    // controller) — the public list always hides deactivated organizations.
    ...(includeInactive ? {} : { isActive: true }),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [organizers, total] = await prisma.$transaction([
    prisma.organizer.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      include: { city: { select: { name: true } }, country: { select: { name: true } } },
    }),
    prisma.organizer.count({ where }),
  ]);

  return { organizers, page, limit, total };
}

export async function getOrganizerBySlug(slug: string) {
  const organizer = await prisma.organizer.findUnique({
    where: { slug },
    include: {
      city: { select: { name: true } },
      country: { select: { name: true } },
      _count: { select: { events: { where: { status: "APPROVED" } } } },
    },
  });

  // Deactivated organizations are hidden from the public entirely.
  if (!organizer || !organizer.isActive) throw Errors.notFound("Organizer");
  return organizer;
}

// ─── Super admin only (route-guarded + asserted here for defense-in-depth) ──

export async function createOrganizer(
  data: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    countryId?: string;
    cityId?: string;
  },
  requester: PermissionUser
) {
  assertSuperAdmin(requester);
  const slug = generateSlug(data.name, true);
  return prisma.organizer.create({
    data: { ...data, slug, createdById: requester!.id },
  });
}

export async function updateOrganizer(
  id: string,
  data: Record<string, unknown>,
  requester: PermissionUser
) {
  assertSuperAdmin(requester);
  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) throw Errors.notFound("Organizer");

  return prisma.organizer.update({ where: { id }, data });
}

/** Soft toggle — deactivating hides the org from public list/detail. */
export async function setOrganizerActive(
  id: string,
  isActive: boolean,
  requester: PermissionUser
) {
  assertSuperAdmin(requester);
  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) throw Errors.notFound("Organizer");

  return prisma.organizer.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, slug: true, isActive: true },
  });
}

export async function verifyOrganizer(id: string) {
  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) throw Errors.notFound("Organizer");
  return prisma.organizer.update({ where: { id }, data: { isVerified: true } });
}

// ─── Members ────────────────────────────────────────────────────────────────

async function getOrganizerById(id: string) {
  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) throw Errors.notFound("Organizer");
  return organizer;
}

/** Super admins always; within the org only OWNER/ADMIN (not EDITOR). */
export async function listMembers(organizerId: string, requester: PermissionUser) {
  await getOrganizerById(organizerId);
  if (!(await canManageOrgMembers(requester, organizerId))) {
    throw Errors.forbidden("Only organization owners and admins can view members.");
  }

  return prisma.organizationMember.findMany({
    where: { organizerId },
    include: { user: { select: MEMBER_USER_SELECT } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMember(
  organizerId: string,
  input: { email: string; role: OrgRole },
  requester: PermissionUser
) {
  assertSuperAdmin(requester);
  await getOrganizerById(organizerId);

  const user = await prisma.user.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) throw Errors.notFound("User");

  const existing = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizerId },
  });
  if (existing) {
    throw Errors.conflict("User is already a member of this organization", "ALREADY_MEMBER");
  }

  return prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizerId,
      role: input.role,
      addedById: requester!.id,
    },
    include: { user: { select: MEMBER_USER_SELECT } },
  });
}

export async function updateMemberRole(
  organizerId: string,
  userId: string,
  role: OrgRole,
  requester: PermissionUser
) {
  assertSuperAdmin(requester);

  const membership = await prisma.organizationMember.findFirst({
    where: { organizerId, userId },
  });
  if (!membership) throw Errors.notFound("Organization member");

  return prisma.organizationMember.update({
    where: { id: membership.id },
    data: { role },
    include: { user: { select: MEMBER_USER_SELECT } },
  });
}

export async function removeMember(
  organizerId: string,
  userId: string,
  requester: PermissionUser
) {
  assertSuperAdmin(requester);

  const membership = await prisma.organizationMember.findFirst({
    where: { organizerId, userId },
  });
  if (!membership) throw Errors.notFound("Organization member");

  await prisma.organizationMember.delete({ where: { id: membership.id } });
}

// ─── "Me" endpoints ─────────────────────────────────────────────────────────

/** The caller's organization memberships (for the org dashboard). */
export async function listMyOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          isVerified: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

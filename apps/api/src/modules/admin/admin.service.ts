import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { parsePagination } from "../../utils/helpers";

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    totalEvents,
    pendingEvents,
    approvedEvents,
    rejectedEvents,
    totalUsers,
    totalOrganizers,
    pendingReports,
  ] = await prisma.$transaction([
    prisma.event.count(),
    prisma.event.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.event.count({ where: { status: "APPROVED" } }),
    prisma.event.count({ where: { status: "REJECTED" } }),
    prisma.user.count(),
    prisma.organizer.count(),
    prisma.eventReport.count({ where: { status: "PENDING" } }),
  ]);

  return { totalEvents, pendingEvents, approvedEvents, rejectedEvents, totalUsers, totalOrganizers, pendingReports };
}

// ─── Event moderation ─────────────────────────────────────────────────────────

export async function adminListEvents(page: number, limit: number, status?: string) {
  const skip = (page - 1) * limit;
  const where = status ? { status: status as never } : {};

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        venue: true,
        address: true,
        posterUrl: true,
        status: true,
        isFeatured: true,
        viewCount: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
        area: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true, slug: true, logoUrl: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { participants: true, reports: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, page, limit, total };
}

export async function approveEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw Errors.notFound("Event");

  return prisma.event.update({
    where: { id },
    data: { status: "APPROVED", publishedAt: new Date() },
  });
}

export async function rejectEvent(id: string, reason?: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw Errors.notFound("Event");

  return prisma.event.update({ where: { id }, data: { status: "REJECTED" } });
}

export async function cancelEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw Errors.notFound("Event");

  return prisma.event.update({ where: { id }, data: { status: "CANCELLED" } });
}

// ─── User management ──────────────────────────────────────────────────────────

export async function adminListUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);

  return { users, page, limit, total };
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Errors.notFound("User");

  return prisma.user.update({ where: { id }, data: { isActive } });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function adminListReports(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [reports, total] = await prisma.$transaction([
    prisma.eventReport.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, slug: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.eventReport.count(),
  ]);

  return { reports, page, limit, total };
}

export async function resolveReport(id: string, status: "REVIEWED" | "DISMISSED" | "ACTION_TAKEN") {
  const report = await prisma.eventReport.findUnique({ where: { id } });
  if (!report) throw Errors.notFound("Report");

  return prisma.eventReport.update({
    where: { id },
    data: { status, resolvedAt: new Date() },
  });
}

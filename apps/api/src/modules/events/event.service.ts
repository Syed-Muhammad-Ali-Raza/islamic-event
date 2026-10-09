import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { config } from "../../config";
import { Errors } from "../../utils/AppError";
import { generateSlug, parsePagination } from "../../utils/helpers";
import { sendNewEventAdminEmail } from "../../services/email.service";
import { notify } from "../../services/notification.service";
import type { CreateEventInput, UpdateEventInput, EventQueryInput } from "./event.validation";

// ─── Select shape used on public event listing ────────────────────────────────
const eventListSelect = {
  id: true,
  slug: true,
  title: true,
  date: true,
  startTime: true,
  endTime: true,
  venue: true,
  latitude: true,
  longitude: true,
  posterUrl: true,
  status: true,
  isFeatured: true,
  viewCount: true,
  category: { select: { id: true, name: true, slug: true } },
  city: { select: { id: true, name: true, slug: true } },
  area: { select: { id: true, name: true } },
  organizer: { select: { id: true, name: true, slug: true, logoUrl: true } },
  createdAt: true,
} satisfies Prisma.EventSelect;

// ─── Select shape for full event detail ───────────────────────────────────────
const eventDetailSelect = {
  ...eventListSelect,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  posterPublicId: true,
  publishedAt: true,
  country: { select: { id: true, name: true, code: true } },
  state: { select: { id: true, name: true } },
  participants: {
    select: {
      id: true,
      role: true,
      displayOrder: true,
      person: { select: { id: true, name: true, slug: true, profileImage: true, description: true } },
    },
    orderBy: { displayOrder: "asc" as const },
  },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.EventSelect;

// ─── List events (public) ─────────────────────────────────────────────────────

export async function listEvents(query: EventQueryInput, userId?: string) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  // Build dynamic where clause
  const where: Prisma.EventWhereInput = {
    status: query.status ?? "APPROVED",
  };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { venue: { contains: query.search, mode: "insensitive" } },
      { city: { name: { contains: query.search, mode: "insensitive" } } },
      { area: { name: { contains: query.search, mode: "insensitive" } } },
      { organizer: { name: { contains: query.search, mode: "insensitive" } } },
      { participants: { some: { person: { name: { contains: query.search, mode: "insensitive" } } } } },
    ];
  }

  if (query.category) {
    where.category = { slug: query.category };
  }

  if (query.city) {
    where.city = { slug: query.city };
  }

  if (query.area) {
    where.area = { slug: query.area };
  }

  if (query.organizer) {
    where.organizer = { slug: query.organizer };
  }

  if (query.date) {
    const start = new Date(query.date);
    const end = new Date(query.date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  } else {
    if (query.fromDate) where.date = { ...where.date as object, gte: new Date(query.fromDate) };
    if (query.toDate) where.date = { ...where.date as object, lte: new Date(query.toDate) };
  }

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      select: eventListSelect,
      orderBy: [{ isFeatured: "desc" }, { date: "asc" }],
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, page, limit, total };
}

// ─── Get single event by slug ─────────────────────────────────────────────────

export async function getEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: eventDetailSelect,
  });

  if (!event) throw Errors.notFound("Event");
  if (event.status !== "APPROVED") throw Errors.notFound("Event");

  // Increment view count (fire-and-forget)
  prisma.event.update({ where: { slug }, data: { viewCount: { increment: 1 } } }).catch(() => null);

  return event;
}

// ─── Create event ─────────────────────────────────────────────────────────────

export async function createEvent(input: CreateEventInput, createdById: string) {
  // Check for duplicate events (same title + date + venue)
  const possibleDuplicate = await prisma.event.findFirst({
    where: {
      title: { equals: input.title, mode: "insensitive" },
      date: new Date(input.date),
      venue: input.venue ?? undefined,
      status: { in: ["APPROVED", "PENDING_REVIEW"] },
    },
    select: { id: true, slug: true, title: true },
  });

  const slug = generateSlug(input.title, true);

  const event = await prisma.event.create({
    data: {
      slug,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      createdById,
      organizerId: input.organizerId,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      countryId: input.countryId,
      stateId: input.stateId,
      cityId: input.cityId,
      areaId: input.areaId,
      venue: input.venue,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      status: "PENDING_REVIEW",
      participants: {
        create: (input.participants ?? []).map((p) => ({
          personId: p.personId,
          role: p.role,
          displayOrder: p.displayOrder ?? 0,
        })),
      },
    },
    select: eventDetailSelect,
  });

  // Phase 12: confirm submission to the creator + alert admins for moderation
  const [creator, admins] = await Promise.all([
    prisma.user.findUnique({
      where: { id: createdById },
      select: { name: true },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, name: true, email: true },
    }),
  ]);

  await notify({
    userId: createdById,
    type: "SYSTEM",
    title: "Event submitted for review",
    body: `"${event.title}" will be visible publicly once approved.`,
    link: "/profile/events",
  });

  for (const admin of admins) {
    await notify({
      userId: admin.id,
      type: "NEW_EVENT",
      title: "New event awaiting review",
      body: `"${event.title}" by ${creator?.name ?? "a community member"}`,
      link: "/admin/events",
    });
    await sendNewEventAdminEmail({
      to: admin.email,
      adminName: admin.name,
      eventTitle: event.title,
      eventUrl: `${config.app.url}/admin/events`,
      creatorName: creator?.name ?? "A community member",
    });
  }

  return { event, possibleDuplicate };
}

// ─── Update event ─────────────────────────────────────────────────────────────

export async function updateEvent(id: string, input: UpdateEventInput, requesterId: string, requesterRole: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, createdById: true, organizerId: true, organizer: { select: { createdById: true } } },
  });

  if (!event) throw Errors.notFound("Event");

  const isCreator = event.createdById === requesterId;
  const isOrganizerOwner = event.organizer?.createdById === requesterId;
  const isAdmin = requesterRole === "ADMIN";

  if (!isCreator && !isOrganizerOwner && !isAdmin) {
    throw Errors.forbidden();
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title, slug: generateSlug(input.title, true) }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.categoryId && { categoryId: input.categoryId }),
      ...(input.organizerId !== undefined && { organizerId: input.organizerId }),
      ...(input.date && { date: new Date(input.date) }),
      ...(input.startTime !== undefined && { startTime: input.startTime }),
      ...(input.endTime !== undefined && { endTime: input.endTime }),
      ...(input.countryId !== undefined && { countryId: input.countryId }),
      ...(input.stateId !== undefined && { stateId: input.stateId }),
      ...(input.cityId !== undefined && { cityId: input.cityId }),
      ...(input.areaId !== undefined && { areaId: input.areaId }),
      ...(input.venue !== undefined && { venue: input.venue }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
    },
    select: eventDetailSelect,
  });

  return updated;
}

// ─── Delete event ─────────────────────────────────────────────────────────────

export async function deleteEvent(id: string, requesterId: string, requesterRole: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, createdById: true, organizer: { select: { createdById: true } } },
  });

  if (!event) throw Errors.notFound("Event");

  const isCreator = event.createdById === requesterId;
  const isOrganizerOwner = event.organizer?.createdById === requesterId;
  const isAdmin = requesterRole === "ADMIN";

  if (!isCreator && !isOrganizerOwner && !isAdmin) {
    throw Errors.forbidden();
  }

  // Soft delete — status CANCELLED rather than hard delete
  await prisma.event.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

// ─── Get events by current user ───────────────────────────────────────────────

export async function getMyEvents(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where: Prisma.EventWhereInput = { createdById: userId };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      select: eventListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, page, limit, total };
}

// ─── Report an event ──────────────────────────────────────────────────────────

export async function reportEvent(
  eventId: string,
  userId: string,
  input: { reason: string; description?: string }
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Errors.notFound("Event");

  return prisma.eventReport.create({
    data: {
      eventId,
      userId,
      reason: input.reason as never,
      description: input.description,
    },
  });
}

// ─── RSVPs (attendance interest) ──────────────────────────────────────────────

export type RsvpState = {
  interested: number;
  attending: number;
  myRsvp: "INTERESTED" | "ATTENDING" | null;
};

async function rsvpCounts(eventId: string): Promise<{ interested: number; attending: number }> {
  const [interested, attending] = await prisma.$transaction([
    prisma.eventRsvp.count({ where: { eventId, type: "INTERESTED" } }),
    prisma.eventRsvp.count({ where: { eventId, type: "ATTENDING" } }),
  ]);
  return { interested, attending };
}

export async function setRsvp(
  eventId: string,
  userId: string,
  type: "INTERESTED" | "ATTENDING"
): Promise<RsvpState> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
  if (!event || event.status !== "APPROVED") throw Errors.notFound("Event");

  await prisma.eventRsvp.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId, type },
    update: { type },
  });

  const counts = await rsvpCounts(eventId);
  return { ...counts, myRsvp: type };
}

export async function removeRsvp(eventId: string, userId: string): Promise<RsvpState> {
  await prisma.eventRsvp.deleteMany({ where: { userId, eventId } });
  const counts = await rsvpCounts(eventId);
  return { ...counts, myRsvp: null };
}

export async function getRsvpState(eventId: string, userId?: string): Promise<RsvpState> {
  const counts = await rsvpCounts(eventId);
  if (!userId) return { ...counts, myRsvp: null };

  const mine = await prisma.eventRsvp.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { type: true },
  });
  return { ...counts, myRsvp: mine?.type ?? null };
}

export type RsvpListEntry = {
  id: string;
  type: "INTERESTED" | "ATTENDING";
  createdAt: string;
  user: { id: string; name: string; email: string };
};

export async function getEventRsvps(
  eventId: string,
  requester: { id: string; role: string },
  page: number,
  limit: number
): Promise<{ rsvps: RsvpListEntry[]; counts: { interested: number; attending: number }; total: number }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { createdById: true },
  });
  if (!event) throw Errors.notFound("Event");
  if (event.createdById !== requester.id && requester.role !== "ADMIN") throw Errors.forbidden();

  const skip = (page - 1) * limit;
  const where = { eventId };

  const [rows, total, interested, attending] = await prisma.$transaction([
    prisma.eventRsvp.findMany({
      where,
      select: {
        id: true,
        type: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
      skip,
      take: limit,
    }),
    prisma.eventRsvp.count({ where }),
    prisma.eventRsvp.count({ where: { eventId, type: "INTERESTED" } }),
    prisma.eventRsvp.count({ where: { eventId, type: "ATTENDING" } }),
  ]);

  return {
    rsvps: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    counts: { interested, attending },
    total,
  };
}

import { Prisma, UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { config } from "../../config";
import { Errors } from "../../utils/AppError";
import { generateSlug, parsePagination } from "../../utils/helpers";
import { isSuperAdmin, canSubmitForOrg, canApproveForOrg } from "../../utils/permissions";
import { sendNewEventAdminEmail, sendRsvpOrganizerEmail } from "../../services/email.service";
import { notify } from "../../services/notification.service";
import type { CreateEventInput, UpdateEventInput, EventQueryInput, CheckinInput } from "./event.validation";

/** The authenticated requester (req.user, attached by requireAuth). */
type EventRequester = { id: string; role: UserRole };

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

  // Public listing is ALWAYS approved-only — a status query param must never
  // leak pending/rejected events. Creators see their own unapproved events via
  // GET /events/mine; admins via /admin/events.
  const where: Prisma.EventWhereInput = {
    status: "APPROVED",
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

export async function createEvent(input: CreateEventInput, requester: EventRequester) {
  // Submitting on behalf of an organization: it must exist, be active, and
  // the requester must be a member (any role). Everyone else's submissions
  // go in without an organization and await platform review as before.
  if (input.organizerId) {
    const organizer = await prisma.organizer.findUnique({
      where: { id: input.organizerId },
      select: { id: true, isActive: true },
    });
    if (!organizer || !organizer.isActive) throw Errors.notFound("Organization");
    if (!(await canSubmitForOrg(requester, input.organizerId))) {
      throw Errors.forbidden("You are not a member of this organization.");
    }
  }

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
      createdById: requester.id,
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

  // Phase 12: confirm submission to the creator, alert platform super admins
  // for moderation, and (for org submissions) the organization's OWNER/ADMIN
  // members. NOTE: the reviewer query must include SUPER_ADMIN — the seeded
  // platform admin carries that role, not legacy ADMIN.
  const [submitter, superAdmins, orgAdmins] = await Promise.all([
    prisma.user.findUnique({
      where: { id: requester.id },
      select: { name: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true },
      select: { id: true, name: true, email: true },
    }),
    input.organizerId
      ? prisma.organizationMember
          .findMany({
            where: { organizerId: input.organizerId, role: { in: ["OWNER", "ADMIN"] } },
            select: { user: { select: { id: true, name: true, email: true } } },
          })
          .then((rows) => rows.map((row) => row.user))
      : Promise.resolve([]),
  ]);

  await notify({
    userId: requester.id,
    type: "SYSTEM",
    title: "Event submitted for review",
    body: `"${event.title}" will be visible publicly once approved.`,
    link: "/profile/events",
  });

  // In-app notice to the org's OWNER/ADMIN members (skip anyone who is also a
  // platform super admin — they are notified below and would be duplicates).
  const superAdminIds = new Set(superAdmins.map((a) => a.id));
  for (const member of orgAdmins) {
    if (superAdminIds.has(member.id)) continue;
    await notify({
      userId: member.id,
      type: "NEW_EVENT",
      title: "New event submitted for your organization",
      body: `"${event.title}" by ${submitter?.name ?? "a member"} — awaiting platform review.`,
      link: "/profile/events",
    });
  }

  for (const admin of superAdmins) {
    await notify({
      userId: admin.id,
      type: "NEW_EVENT",
      title: "New event awaiting review",
      body: `"${event.title}" by ${submitter?.name ?? "a community member"}`,
      link: "/admin/events",
    });
    await sendNewEventAdminEmail({
      to: admin.email,
      adminName: admin.name,
      eventTitle: event.title,
      eventUrl: `${config.app.url}/admin/events`,
      creatorName: submitter?.name ?? "A community member",
    });
  }

  return { event, possibleDuplicate };
}

// ─── Event management permissions (shared) ────────────────────────────────────

/** Fields the ownership rule needs — always include these in a management select. */
const managementSelect = {
  createdById: true,
  organizerId: true,
  organizer: { select: { createdById: true } },
} satisfies Prisma.EventSelect;

type ManageableEvent = {
  createdById: string;
  organizerId: string | null;
  organizer: { createdById: string } | null;
};

/**
 * Who may manage an event — update/delete it, read its RSVP roster or export
 * it as CSV, and scan check-ins: a platform super admin, the event's creator,
 * the creator of the attached organization (implicit owner — memberships may
 * not exist yet for pre-existing orgs), or the organization's OWNER/ADMIN
 * members. Org EDITORs cannot manage events.
 */
async function canManageEvent(
  event: ManageableEvent,
  requester: EventRequester
): Promise<boolean> {
  if (isSuperAdmin(requester)) return true;
  if (event.createdById === requester.id) return true;
  if (event.organizer?.createdById === requester.id) return true;
  if (event.organizerId && (await canApproveForOrg(requester, event.organizerId))) {
    return true;
  }
  return false;
}

/**
 * Loads an event with `select` (which must include the managementSelect
 * fields) or throws 404; then enforces canManageEvent or throws 403.
 */
async function requireEventManagement<S extends Prisma.EventSelect>(
  eventId: string,
  requester: EventRequester,
  select: S
): Promise<Prisma.EventGetPayload<{ select: S }>> {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select });
  if (!event) throw Errors.notFound("Event");
  // The select provably includes the management fields at every call site;
  // generics can't express that, hence the assertion.
  if (!(await canManageEvent(event as unknown as ManageableEvent, requester))) {
    throw Errors.forbidden();
  }
  return event;
}

// ─── Update event ─────────────────────────────────────────────────────────────

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
  requester: EventRequester
) {
  const event = await requireEventManagement(id, requester, { id: true, ...managementSelect });

  // Moving the event to another organization: only members of that
  // organization may submit content for it.
  if (input.organizerId && input.organizerId !== event.organizerId) {
    const organizer = await prisma.organizer.findUnique({
      where: { id: input.organizerId },
      select: { id: true, isActive: true },
    });
    if (!organizer || !organizer.isActive) throw Errors.notFound("Organization");
    if (!(await canSubmitForOrg(requester, input.organizerId))) {
      throw Errors.forbidden("You are not a member of that organization.");
    }
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

export async function deleteEvent(id: string, requester: EventRequester) {
  await requireEventManagement(id, requester, { id: true, ...managementSelect });

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
    select: { status: true, createdById: true, title: true, slug: true },
  });
  if (!event || event.status !== "APPROVED") throw Errors.notFound("Event");

  const previous = await prisma.eventRsvp.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { type: true },
  });

  await prisma.eventRsvp.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId, type },
    update: { type },
  });

  // Phase 22: tell the organizer about first-time RSVPs (never on switches)
  if (!previous && event.createdById !== userId) {
    const attendee = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const action = type === "ATTENDING" ? "is attending" : "is interested in";
    await notify({
      userId: event.createdById,
      type: "RSVP_NEW",
      title: type === "ATTENDING" ? "New attendee for your event" : "New interest in your event",
      body: `${attendee?.name ?? "Someone"} ${action} "${event.title}"`,
      link: "/profile/events",
    });
    if (type === "ATTENDING" && attendee) {
      const organizer = await prisma.user.findUnique({
        where: { id: event.createdById },
        select: { name: true, email: true },
      });
      if (organizer) {
        await sendRsvpOrganizerEmail({
          to: organizer.email,
          organizerName: organizer.name,
          attendeeName: attendee.name,
          eventTitle: event.title,
          eventUrl: `${config.app.url}/events/${event.slug}`,
        });
      }
    }
  }

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
  checkedInAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

export async function getEventRsvps(
  eventId: string,
  requester: EventRequester,
  page: number,
  limit: number
): Promise<{
  rsvps: RsvpListEntry[];
  counts: { interested: number; attending: number; checkedIn: number };
  total: number;
}> {
  await requireEventManagement(eventId, requester, { id: true, ...managementSelect });

  const skip = (page - 1) * limit;
  const where = { eventId };

  const [rows, total, interested, attending, checkedIn] = await prisma.$transaction([
    prisma.eventRsvp.findMany({
      where,
      select: {
        id: true,
        type: true,
        checkedInAt: true,
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
    prisma.eventRsvp.count({ where: { eventId, checkedInAt: { not: null } } }),
  ]);

  return {
    rsvps: rows.map((r) => ({
      ...r,
      checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
    counts: { interested, attending, checkedIn },
    total,
  };
}

export async function getEventRsvpsCsv(
  eventId: string,
  requester: EventRequester
): Promise<{ csv: string; eventTitle: string }> {
  const event = await requireEventManagement(eventId, requester, {
    id: true,
    title: true,
    ...managementSelect,
  });

  const rows = await prisma.eventRsvp.findMany({
    where: { eventId },
    select: {
      type: true,
      createdAt: true,
      checkedInAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = "Name,Email,Type,RSVP Date,Checked In";
  const lines = rows.map((r) =>
    [
      escape(r.user.name),
      escape(r.user.email),
      r.type,
      r.createdAt.toISOString().slice(0, 10),
      r.checkedInAt ? r.checkedInAt.toISOString().slice(0, 10) : "",
    ].join(",")
  );

  return { csv: [header, ...lines].join("\r\n"), eventTitle: event.title };
}

// ─── Attendee QR check-in ────────────────────────────────────────────────────

function signCheckinToken(rsvpId: string, eventId: string): string {
  return jwt.sign({ rsvpId, eventId }, config.jwt.accessSecret, { expiresIn: "30d" });
}

function verifyCheckinToken(code: string): { rsvpId: string; eventId: string } | null {
  try {
    const payload = jwt.verify(code, config.jwt.accessSecret) as { rsvpId?: string; eventId?: string };
    if (!payload.rsvpId || !payload.eventId) return null;
    return { rsvpId: payload.rsvpId, eventId: payload.eventId };
  } catch {
    return null;
  }
}

export type MyRsvpInfo = {
  type: "INTERESTED" | "ATTENDING";
  checkedInAt: string | null;
  createdAt: string;
  qrToken: string;
};

export async function getMyRsvp(eventId: string, userId: string): Promise<MyRsvpInfo> {
  const rsvp = await prisma.eventRsvp.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { id: true, type: true, checkedInAt: true, createdAt: true },
  });
  if (!rsvp) throw Errors.notFound("RSVP");
  return {
    type: rsvp.type,
    checkedInAt: rsvp.checkedInAt ? rsvp.checkedInAt.toISOString() : null,
    createdAt: rsvp.createdAt.toISOString(),
    qrToken: signCheckinToken(rsvp.id, eventId),
  };
}

export type CheckinResult = {
  attendee: { id: string; name: string; email: string };
  checkedInAt: string;
  alreadyCheckedIn: boolean;
};

export async function checkInAttendee(
  eventId: string,
  requester: EventRequester,
  code: string
): Promise<CheckinResult> {
  await requireEventManagement(eventId, requester, { id: true, ...managementSelect });

  const payload = verifyCheckinToken(code.trim());
  if (!payload || payload.eventId !== eventId) throw Errors.notFound("QR code");

  const rsvp = await prisma.eventRsvp.findUnique({
    where: { id: payload.rsvpId },
    select: {
      id: true,
      eventId: true,
      type: true,
      checkedInAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!rsvp || rsvp.eventId !== eventId) throw Errors.notFound("QR code");

  if (rsvp.type !== "ATTENDING") {
    throw Errors.conflict(
      "This person RSVP'd as Interested only — ask them to switch to Attending first.",
      "RSVP_NOT_ATTENDING"
    );
  }

  if (rsvp.checkedInAt) {
    return {
      attendee: rsvp.user,
      checkedInAt: rsvp.checkedInAt.toISOString(),
      alreadyCheckedIn: true,
    };
  }

  const updated = await prisma.eventRsvp.update({
    where: { id: rsvp.id },
    data: { checkedInAt: new Date() },
  });

  return {
    attendee: rsvp.user,
    checkedInAt: updated.checkedInAt!.toISOString(),
    alreadyCheckedIn: false,
  };
}

export async function undoCheckIn(
  eventId: string,
  requester: EventRequester,
  rsvpId: string
): Promise<{ rsvpId: string }> {
  await requireEventManagement(eventId, requester, { id: true, ...managementSelect });

  const rsvp = await prisma.eventRsvp.findUnique({
    where: { id: rsvpId },
    select: { eventId: true, checkedInAt: true },
  });
  if (!rsvp || rsvp.eventId !== eventId) throw Errors.notFound("RSVP");
  if (!rsvp.checkedInAt) throw Errors.conflict("Not checked in yet", "NOT_CHECKED_IN");

  await prisma.eventRsvp.update({
    where: { id: rsvpId },
    data: { checkedInAt: null },
  });
  return { rsvpId };
}

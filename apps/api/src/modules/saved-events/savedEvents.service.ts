import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";

export async function saveEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId, status: "APPROVED" } });
  if (!event) throw Errors.notFound("Event");

  try {
    return await prisma.savedEvent.create({ data: { userId, eventId } });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      throw Errors.conflict("Event already saved.", "ALREADY_SAVED");
    }
    throw err;
  }
}

export async function unsaveEvent(userId: string, eventId: string) {
  const saved = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (!saved) throw Errors.notFound("Saved event");

  await prisma.savedEvent.delete({ where: { userId_eventId: { userId, eventId } } });
}

export async function getSavedEvents(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = { userId };

  const [items, total] = await prisma.$transaction([
    prisma.savedEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true, slug: true, title: true, date: true, startTime: true, endTime: true,
            venue: true, posterUrl: true, status: true, isFeatured: true, viewCount: true,
            category: { select: { id: true, name: true, slug: true } },
            city: { select: { id: true, name: true, slug: true } },
            area: { select: { id: true, name: true } },
            organizer: { select: { id: true, name: true, slug: true, logoUrl: true } },
            createdAt: true,
          },
        },
      },
    }),
    prisma.savedEvent.count({ where }),
  ]);

  return { items, page, limit, total };
}

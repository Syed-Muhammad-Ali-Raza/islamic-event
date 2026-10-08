import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { generateSlug } from "../../utils/helpers";

export async function listOrganizers(page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

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

  if (!organizer) throw Errors.notFound("Organizer");
  return organizer;
}

export async function createOrganizer(data: {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  countryId?: string;
  cityId?: string;
}, createdById: string) {
  const slug = generateSlug(data.name, true);
  return prisma.organizer.create({
    data: { ...data, slug, createdById },
  });
}

export async function updateOrganizer(
  id: string,
  data: Record<string, unknown>,
  requesterId: string,
  requesterRole: string
) {
  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) throw Errors.notFound("Organizer");

  const isOwner = organizer.createdById === requesterId;
  const isAdmin = requesterRole === "ADMIN";

  if (!isOwner && !isAdmin) throw Errors.forbidden();

  return prisma.organizer.update({ where: { id }, data });
}

export async function verifyOrganizer(id: string) {
  const organizer = await prisma.organizer.findUnique({ where: { id } });
  if (!organizer) throw Errors.notFound("Organizer");
  return prisma.organizer.update({ where: { id }, data: { isVerified: true } });
}

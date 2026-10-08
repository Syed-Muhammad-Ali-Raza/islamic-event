import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { generateSlug, parsePagination } from "../../utils/helpers";

export async function listPeople(page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [people, total] = await prisma.$transaction([
    prisma.person.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    prisma.person.count({ where }),
  ]);

  return { people, page, limit, total };
}

export async function getPersonById(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      eventParticipants: {
        where: { event: { status: "APPROVED" } },
        include: { event: { select: { id: true, slug: true, title: true, date: true, posterUrl: true } } },
        orderBy: { event: { date: "desc" } },
        take: 20,
      },
    },
  });

  if (!person) throw Errors.notFound("Person");
  return person;
}

export async function createPerson(data: { name: string; description?: string }) {
  const slug = generateSlug(data.name, true);
  return prisma.person.create({ data: { name: data.name, slug, description: data.description } });
}

export async function updatePerson(id: string, data: Partial<{ name: string; description: string; profileImage: string }>) {
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) throw Errors.notFound("Person");

  return prisma.person.update({ where: { id }, data });
}

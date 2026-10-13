import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { ScholarQueryInput } from "./scholar.validation";

const select = {
  id: true,
  sourceId: true,
  slug: true,
  name: true,
  nameUrdu: true,
  honorific: true,
  sect: true,
  category: true,
  status: true,
  birthDate: true,
  deathDate: true,
  city: true,
  country: true,
  bio: true,
  education: true,
  works: true,
  officialLinks: true,
  photoUrl: true,
  photoCredit: true,
  photoLicense: true,
  sources: true,
  confidence: true,
  lastVerified: true,
  isActive: true,
} satisfies Prisma.ScholarSelect;

export async function listScholars(query: ScholarQueryInput, page: number, limit: number) {
  const where: Prisma.ScholarWhereInput = {
    isActive: true,
    ...(query.sect ? { sect: query.sect } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { nameUrdu: { contains: query.q, mode: "insensitive" } },
            { honorific: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { country: { contains: query.q, mode: "insensitive" } },
            { bio: { contains: query.q, mode: "insensitive" } },
            { education: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [scholars, total] = await prisma.$transaction([
    prisma.scholar.findMany({
      where,
      select,
      orderBy: [{ sect: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.scholar.count({ where }),
  ]);

  return { scholars, total };
}

export async function getScholar(sourceId: string) {
  const scholar = await prisma.scholar.findUnique({ where: { sourceId }, select });
  if (!scholar || !scholar.isActive) throw Errors.notFound("Scholar");
  return scholar;
}

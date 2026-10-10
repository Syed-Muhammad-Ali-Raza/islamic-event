import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { ImambargahQueryInput } from "./imambargah.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  city: true,
  area: true,
  address: true,
  googleMapsUrl: true,
  latitude: true,
  longitude: true,
  yearBuilt: true,
  founderOrCaretaker: true,
  contact: true,
  notes: true,
  sourceUrl: true,
  verified: true,
  confidence: true,
  isActive: true,
} satisfies Prisma.ImambargahSelect;

export async function listImambargahs(query: ImambargahQueryInput, page: number, limit: number) {
  const where: Prisma.ImambargahWhereInput = {
    isActive: true,
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { area: { contains: query.q, mode: "insensitive" } },
            { address: { contains: query.q, mode: "insensitive" } },
            { founderOrCaretaker: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [points, total] = await prisma.$transaction([
    prisma.imambargah.findMany({
      where,
      select,
      orderBy: [{ city: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.imambargah.count({ where }),
  ]);

  return { points, total };
}

export async function getImambargah(sourceId: string) {
  const point = await prisma.imambargah.findUnique({ where: { sourceId }, select });
  if (!point || !point.isActive) throw Errors.notFound("Imambargah");
  return point;
}

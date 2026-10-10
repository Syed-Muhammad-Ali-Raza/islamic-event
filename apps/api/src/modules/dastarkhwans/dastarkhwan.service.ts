import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { DastarkhwanQueryInput } from "./dastarkhwan.validation";

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
  type: true,
  schedule: true,
  sourceUrl: true,
  sourceYear: true,
  verified: true,
  notes: true,
  isActive: true,
} satisfies Prisma.DastarkhwanSelect;

export async function listDastarkhwans(query: DastarkhwanQueryInput, page: number, limit: number) {
  const where: Prisma.DastarkhwanWhereInput = {
    isActive: true,
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { area: { contains: query.q, mode: "insensitive" } },
            { address: { contains: query.q, mode: "insensitive" } },
            { type: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [points, total] = await prisma.$transaction([
    prisma.dastarkhwan.findMany({
      where,
      select,
      orderBy: [{ city: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.dastarkhwan.count({ where }),
  ]);

  return { points, total };
}

export async function getDastarkhwan(sourceId: string) {
  const point = await prisma.dastarkhwan.findUnique({ where: { sourceId }, select });
  if (!point || !point.isActive) throw Errors.notFound("Dastarkhwan point");
  return point;
}

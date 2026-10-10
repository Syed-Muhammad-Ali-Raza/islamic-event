import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { PlaceQueryInput } from "./place.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  category: true,
  type: true,
  city: true,
  province: true,
  address: true,
  mapLink: true,
  builtYear: true,
  builtBuilder: true,
  unescoStatus: true,
  timings: true,
  ticket: true,
  description: true,
  sourceLink: true,
  verified: true,
  isActive: true,
} satisfies Prisma.PlaceSelect;

export async function listPlaces(query: PlaceQueryInput, page: number, limit: number) {
  const where: Prisma.PlaceWhereInput = {
    isActive: true,
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.category ? { category: { equals: query.category, mode: "insensitive" } } : {}),
    ...(query.province ? { province: { equals: query.province, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { type: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { address: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
            { builtBuilder: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [places, total] = await prisma.$transaction([
    prisma.place.findMany({
      where,
      select,
      orderBy: [{ province: "asc" }, { city: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.place.count({ where }),
  ]);

  return { places, total };
}

export async function getPlace(sourceId: string) {
  const place = await prisma.place.findUnique({ where: { sourceId }, select });
  if (!place || !place.isActive) throw Errors.notFound("Place");
  return place;
}

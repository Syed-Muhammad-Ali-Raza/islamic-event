import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { AuqafUrsDateQueryInput } from "./auqafUrsDate.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  type: true,
  zone: true,
  province: true,
  dateAsPublished: true,
  googleMapsUrl: true,
  source: true,
  verified: true,
  isActive: true,
} satisfies Prisma.AuqafUrsDateSelect;

export async function listAuqafUrsDates(query: AuqafUrsDateQueryInput, page: number, limit: number) {
  const where: Prisma.AuqafUrsDateWhereInput = {
    isActive: true,
    ...(query.zone ? { zone: { equals: query.zone, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { zone: { contains: query.q, mode: "insensitive" } },
            { dateAsPublished: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [dates, total] = await prisma.$transaction([
    prisma.auqafUrsDate.findMany({
      where,
      select,
      orderBy: [{ zone: "asc" }, { dateAsPublished: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.auqafUrsDate.count({ where }),
  ]);

  return { dates, total };
}

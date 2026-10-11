import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { MelaQueryInput } from "./mela.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  type: true,
  city: true,
  province: true,
  venue: true,
  address: true,
  googleMapsUrl: true,
  latitude: true,
  longitude: true,
  whenHeld: true,
  duration: true,
  history: true,
  whatHappens: true,
  statusNotes: true,
  source: true,
  verified: true,
  isActive: true,
} satisfies Prisma.MelaSelect;

export async function listMelas(query: MelaQueryInput, page: number, limit: number) {
  const where: Prisma.MelaWhereInput = {
    isActive: true,
    ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}),
    ...(query.province ? { province: { equals: query.province, mode: "insensitive" } } : {}),
    ...(query.type ? { type: { contains: query.type, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { type: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { venue: { contains: query.q, mode: "insensitive" } },
            { whatHappens: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [melas, total] = await prisma.$transaction([
    prisma.mela.findMany({
      where,
      select,
      orderBy: [{ province: "asc" }, { city: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.mela.count({ where }),
  ]);

  return { melas, total };
}

export async function getMela(sourceId: string) {
  const mela = await prisma.mela.findUnique({ where: { sourceId }, select });
  if (!mela || !mela.isActive) throw Errors.notFound("Mela");
  return mela;
}

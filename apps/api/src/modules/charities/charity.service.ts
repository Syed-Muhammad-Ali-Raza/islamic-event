import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { CharityQueryInput } from "./charity.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  country: true,
  province: true,
  city: true,
  type: true,
  focus: true,
  policyNote: true,
  address: true,
  latitude: true,
  longitude: true,
  googleMapsLink: true,
  contactNumbers: true,
  founded: true,
  founder: true,
  website: true,
  registration: true,
  isActive: true,
} satisfies Prisma.CharitySelect;

export async function listCharities(query: CharityQueryInput, page: number, limit: number) {
  const where: Prisma.CharityWhereInput = {
    isActive: true,
    ...(query.country ? { country: { equals: query.country, mode: "insensitive" } } : {}),
    ...(query.province ? { province: { equals: query.province, mode: "insensitive" } } : {}),
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.policy === "100"
      ? { policyNote: { contains: "100%", mode: "insensitive" as const } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { focus: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { province: { contains: query.q, mode: "insensitive" } },
            { type: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [charities, total] = await prisma.$transaction([
    prisma.charity.findMany({
      where,
      select,
      orderBy: [{ province: "asc" }, { city: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.charity.count({ where }),
  ]);

  return { charities, total };
}

export async function getCharity(sourceId: string) {
  const c = await prisma.charity.findUnique({ where: { sourceId }, select });
  if (!c || !c.isActive) throw Errors.notFound("Charity");
  return c;
}

// Distinct filter options for cascading country → province → city dropdowns
export async function listCharityFacets() {
  const [countries, provinces, cities] = await Promise.all([
    prisma.charity.findMany({
      where: { isActive: true },
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
    prisma.charity.findMany({
      where: { isActive: true },
      distinct: ["province"],
      select: { province: true },
      orderBy: { province: "asc" },
    }),
    prisma.charity.findMany({
      where: { isActive: true },
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
  ]);
  return {
    countries: countries.map((c) => c.country),
    provinces: provinces.map((p) => p.province),
    cities: cities.map((c) => c.city),
  };
}

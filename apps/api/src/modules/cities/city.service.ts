import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";

// ─── List active cities with approved event counts (desc, zeros included) ────

export async function listCitiesWithEvents() {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      state: { select: { name: true } },
      _count: { select: { events: { where: { status: "APPROVED" } } } },
    },
    orderBy: [{ events: { _count: "desc" } }, { name: "asc" }],
  });

  return cities.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    state: c.state.name,
    eventCount: c._count.events,
  }));
}

// ─── Get single city by slug (with counts + category breakdown) ──────────────

export async function getCityBySlug(slug: string) {
  const city = await prisma.city.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      state: { select: { name: true } },
      _count: { select: { events: { where: { status: "APPROVED" } } } },
    },
  });

  if (!city) throw Errors.notFound("City");

  const rows = await prisma.event.findMany({
    where: { cityId: city.id, status: "APPROVED" },
    select: { categoryId: true },
  });

  const countByCategory = new Map<string, number>();
  for (const row of rows) {
    if (row.categoryId) {
      countByCategory.set(row.categoryId, (countByCategory.get(row.categoryId) ?? 0) + 1);
    }
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: [...countByCategory.keys()] } },
    select: { id: true, name: true, slug: true },
  });

  return {
    id: city.id,
    name: city.name,
    slug: city.slug,
    state: city.state.name,
    eventCount: city._count.events,
    categoryCounts: categories
      .map((c) => ({ category: c, count: countByCategory.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count),
  };
}

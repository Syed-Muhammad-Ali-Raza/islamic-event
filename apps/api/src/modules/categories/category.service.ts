import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import { generateSlug } from "../../utils/helpers";

// ─── List all active categories ───────────────────────────────────────────────

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { events: { where: { status: "APPROVED" } } } },
    },
  });
}

// ─── Get single category by slug ─────────────────────────────────────────────

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { events: { where: { status: "APPROVED" } } } },
    },
  });

  if (!category) throw Errors.notFound("Category");
  return category;
}

// ─── Admin: create category ───────────────────────────────────────────────────

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}) {
  const slug = generateSlug(data.name);

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

// ─── Admin: update category ───────────────────────────────────────────────────

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; icon: string; isActive: boolean; sortOrder: number }>
) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw Errors.notFound("Category");

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name, slug: generateSlug(data.name) }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
}

// ─── Admin: delete category ───────────────────────────────────────────────────

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw Errors.notFound("Category");

  // Soft delete — set inactive rather than destroy
  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}

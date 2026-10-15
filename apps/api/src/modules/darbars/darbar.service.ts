import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { PermissionUser } from "../../utils/permissions";
import { createDirectorySubmission, applySubmissionUpdate } from "../../services/approval.service";
import type { DarbarQueryInput, CreateDarbarInput, UpdateDarbarInput } from "./darbar.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  saint: true,
  saintDeathYear: true,
  ursDate: true,
  city: true,
  province: true,
  address: true,
  mapLink: true,
  timings: true,
  description: true,
  sourceLink: true,
  verified: true,
  isActive: true,
  approvalStatus: true,
} satisfies Prisma.DarbarSelect;

export async function listDarbars(query: DarbarQueryInput, page: number, limit: number) {
  const where: Prisma.DarbarWhereInput = {
    isActive: true,
    approvalStatus: "APPROVED",
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.province ? { province: { equals: query.province, mode: "insensitive" } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { saint: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { address: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [darbars, total] = await prisma.$transaction([
    prisma.darbar.findMany({
      where,
      select,
      orderBy: [{ province: "asc" }, { city: "asc" }, { name: "asc" }],
      skip,
      take: limit,
    }),
    prisma.darbar.count({ where }),
  ]);

  return { darbars, total };
}

export async function getDarbar(sourceId: string) {
  const darbar = await prisma.darbar.findUnique({ where: { sourceId }, select });
  if (!darbar || !darbar.isActive || darbar.approvalStatus !== "APPROVED") throw Errors.notFound("Darbar");
  return darbar;
}

// ─── Submissions (approval flow) ─────────────────────────────────────────────

export async function createDarbar(
  input: CreateDarbarInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return createDirectorySubmission("darbar", user, content, organizerId);
}

export async function updateDarbar(
  id: string,
  input: UpdateDarbarInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return applySubmissionUpdate("darbar", id, user, content, organizerId);
}

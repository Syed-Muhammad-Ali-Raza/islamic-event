import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { PermissionUser } from "../../utils/permissions";
import { createDirectorySubmission, applySubmissionUpdate } from "../../services/approval.service";
import type { UrsDateQueryInput, CreateUrsDateInput, UpdateUrsDateInput } from "./ursDate.validation";

const select = {
  id: true,
  sourceId: true,
  name: true,
  saint: true,
  saintDeathYear: true,
  city: true,
  ursRule: true,
  calendarBasis: true,
  lastObserved: true,
  nextExpected: true,
  confidence: true,
  sources: true,
  notes: true,
  howToConfirm: true,
  researched: true,
  upcomingOrder: true,
  isActive: true,
  approvalStatus: true,
} satisfies Prisma.UrsDateSelect;

export async function listUrsDates(query: UrsDateQueryInput, page: number, limit: number) {
  const where: Prisma.UrsDateWhereInput = {
    isActive: true,
    approvalStatus: "APPROVED",
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.researched ? { researched: query.researched === "true" } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { saint: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { nextExpected: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [dates, total] = await prisma.$transaction([
    prisma.ursDate.findMany({
      where,
      select,
      orderBy: [
        { upcomingOrder: { sort: "asc", nulls: "last" } },
        { researched: "desc" },
        { city: "asc" },
        { name: "asc" },
      ],
      skip,
      take: limit,
    }),
    prisma.ursDate.count({ where }),
  ]);

  return { dates, total };
}

export async function getUrsDate(sourceId: string) {
  const date = await prisma.ursDate.findUnique({ where: { sourceId }, select });
  if (!date || !date.isActive || date.approvalStatus !== "APPROVED") throw Errors.notFound("Urs date");
  return date;
}

// ─── Submissions (approval flow) ─────────────────────────────────────────────

export async function createUrsDate(
  input: CreateUrsDateInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return createDirectorySubmission("ursDate", user, content, organizerId);
}

export async function updateUrsDate(
  id: string,
  input: UpdateUrsDateInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return applySubmissionUpdate("ursDate", id, user, content, organizerId);
}

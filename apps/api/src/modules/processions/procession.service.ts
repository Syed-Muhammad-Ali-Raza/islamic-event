import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { PermissionUser } from "../../utils/permissions";
import { createDirectorySubmission, applySubmissionUpdate } from "../../services/approval.service";
import type { ProcessionQueryInput, CreateProcessionInput, UpdateProcessionInput } from "./procession.validation";

const select = {
  id: true,
  sourceId: true,
  city: true,
  month: true,
  day: true,
  kind: true,
  name: true,
  type: true,
  start: true,
  end: true,
  route: true,
  routeHighlights: true,
  time: true,
  googleMaps: true,
  description: true,
  notes: true,
  sortOrder: true,
  isActive: true,
  approvalStatus: true,
} satisfies Prisma.ProcessionSelect;

export async function listProcessions(query: ProcessionQueryInput, page: number, limit: number) {
  const where: Prisma.ProcessionWhereInput = {
    isActive: true,
    approvalStatus: "APPROVED",
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.month ? { month: query.month } : {}),
    ...(query.day ? { day: query.day } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { city: { contains: query.q, mode: "insensitive" } },
            { type: { contains: query.q, mode: "insensitive" } },
            { start: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [processions, total] = await prisma.$transaction([
    prisma.procession.findMany({
      where,
      select,
      orderBy: [{ city: "asc" }, { sortOrder: "asc" }],
      skip,
      take: limit,
    }),
    prisma.procession.count({ where }),
  ]);

  return { processions, total };
}

export async function getProcession(sourceId: string) {
  const p = await prisma.procession.findUnique({ where: { sourceId }, select });
  if (!p || !p.isActive || p.approvalStatus !== "APPROVED") throw Errors.notFound("Procession");
  return p;
}

// ─── Submissions (approval flow) ─────────────────────────────────────────────

export async function createProcession(
  input: CreateProcessionInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return createDirectorySubmission("procession", user, content, organizerId);
}

export async function updateProcession(
  id: string,
  input: UpdateProcessionInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return applySubmissionUpdate("procession", id, user, content, organizerId);
}

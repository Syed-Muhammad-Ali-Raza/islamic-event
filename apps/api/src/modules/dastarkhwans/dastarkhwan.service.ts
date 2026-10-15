import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Errors } from "../../utils/AppError";
import type { PermissionUser } from "../../utils/permissions";
import { createDirectorySubmission, applySubmissionUpdate } from "../../services/approval.service";
import type { DastarkhwanQueryInput, CreateDastarkhwanInput, UpdateDastarkhwanInput } from "./dastarkhwan.validation";

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
  approvalStatus: true,
} satisfies Prisma.DastarkhwanSelect;

export async function listDastarkhwans(query: DastarkhwanQueryInput, page: number, limit: number) {
  const where: Prisma.DastarkhwanWhereInput = {
    isActive: true,
    approvalStatus: "APPROVED",
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
  if (!point || !point.isActive || point.approvalStatus !== "APPROVED") throw Errors.notFound("Dastarkhwan point");
  return point;
}

// ─── Submissions (approval flow) ─────────────────────────────────────────────

export async function createDastarkhwan(
  input: CreateDastarkhwanInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return createDirectorySubmission("dastarkhwan", user, content, organizerId);
}

export async function updateDastarkhwan(
  id: string,
  input: UpdateDastarkhwanInput,
  user: PermissionUser
) {
  const { organizerId, ...content } = input;
  return applySubmissionUpdate("dastarkhwan", id, user, content, organizerId);
}

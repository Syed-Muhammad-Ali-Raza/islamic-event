import { z } from "zod";

// Shared validation for GET /api/v1/approvals (permission-scoped queue) and
// for the per-module POST /:id/reject bodies.

export const ApprovalsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ALL"]).optional().default("PENDING"),
  mine: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((v) => v === "true"),
  module: z
    .enum(["dastarkhwan", "imambargah", "place", "darbar", "ursDate", "procession", "charity", "mela", "scholar"])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ApprovalsQueryInput = z.infer<typeof ApprovalsQuerySchema>;

export const RejectSubmissionSchema = z.object({
  reason: z.string().trim().min(3, "Rejection reason must be at least 3 characters").max(500).optional(),
});

export type RejectSubmissionInput = z.infer<typeof RejectSubmissionSchema>;

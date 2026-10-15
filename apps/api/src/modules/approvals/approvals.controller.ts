import { Request, Response, NextFunction } from "express";
import * as ApprovalService from "../../services/approval.service";
import type { DirectoryKey } from "../../services/approval.service";
import { ApprovalsQueryInput } from "./approvals.validation";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { parsePagination } from "../../utils/helpers";

// ─── GET /api/v1/approvals — permission-scoped queue ─────────────────────────

export async function listApprovals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query.page, req.query.limit);
    const query = req.query as unknown as ApprovalsQueryInput;
    const result = await ApprovalService.listSubmissions(req.user!, {
      status: query.status,
      mine: query.mine,
      module: query.module,
      page,
      limit,
    });
    sendPaginated({ res, data: result.items, page, limit, total: result.total });
  } catch (err) {
    next(err);
  }
}

// ─── Per-module approve/reject handlers ──────────────────────────────────────
// Each directory module mounts these for its own :id routes; the permission
// re-check happens inside decideSubmission (never just in queue scoping).

export function moderationControllers(key: DirectoryKey) {
  return {
    approve: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const row = await ApprovalService.decideSubmission(key, req.params.id, req.user!, "APPROVED");
        sendSuccess({ res, data: row, message: "Submission approved." });
      } catch (err) {
        next(err);
      }
    },
    reject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const row = await ApprovalService.decideSubmission(
          key,
          req.params.id,
          req.user!,
          "REJECTED",
          req.body?.reason
        );
        sendSuccess({ res, data: row, message: "Submission rejected." });
      } catch (err) {
        next(err);
      }
    },
  };
}

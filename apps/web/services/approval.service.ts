import { apiClient } from "@/lib/api-client";
import type {
  ApiSuccess,
  ApprovalStatusFilter,
  DirectoryModuleKey,
  DirectorySubmission,
  PaginatedResponse,
} from "@/types";

// ─── Directory submissions & the moderation queue ────────────────────────────
// Every moderated directory shares these endpoints: POST /<route> submits,
// GET /approvals lists the permission-scoped queue, and POST
// /<route>/:id/approve|reject decide. The API re-checks permissions on every
// call — the queue is advisory, never the authority.

/** module key → public route segment (mirrors the API registry). */
export const MODULE_ROUTES: Record<DirectoryModuleKey, string> = {
  dastarkhwan: "dastarkhwans",
  imambargah: "imambargahs",
  place: "places",
  darbar: "darbars",
  ursDate: "urs-dates",
  procession: "processions",
  charity: "charities",
  mela: "melas",
  scholar: "scholars",
};

/** Where each directory is publicly browsable in the web app (urs dates,
 *  processions and charities render inside their category pages). */
export const MODULE_HREF: Record<DirectoryModuleKey, string> = {
  dastarkhwan: "/dastarkhwan",
  imambargah: "/imambargahs",
  place: "/places",
  darbar: "/darbars",
  ursDate: "/categories/urs",
  procession: "/categories/muharram",
  charity: "/categories/charity",
  mela: "/melas",
  scholar: "/scholars",
};

export interface ApprovalQueueParams {
  status?: ApprovalStatusFilter;
  mine?: boolean;
  module?: DirectoryModuleKey;
  page?: number;
  limit?: number;
}

export const approvalService = {
  /** Permission-scoped queue: super admin all, org OWNER/ADMIN own orgs + own,
   *  everyone else their own submissions. */
  async listQueue(params: ApprovalQueueParams = {}) {
    const res = await apiClient.get<PaginatedResponse<DirectorySubmission>>("/approvals", {
      params: {
        status: params.status ?? "PENDING",
        mine: params.mine ? "true" : undefined,
        module: params.module,
        page: params.page,
        limit: params.limit,
      },
    });
    return res.data;
  },

  /** Submit a new directory listing (becomes PENDING unless auto-approve). */
  async submit(module: DirectoryModuleKey, data: Record<string, unknown>) {
    const res = await apiClient.post<ApiSuccess<DirectorySubmission>>(
      `/${MODULE_ROUTES[module]}`,
      data
    );
    return res.data.data;
  },

  async approve(module: DirectoryModuleKey, id: string) {
    const res = await apiClient.post<ApiSuccess<DirectorySubmission>>(
      `/${MODULE_ROUTES[module]}/${id}/approve`
    );
    return res.data.data;
  },

  async reject(module: DirectoryModuleKey, id: string, reason?: string) {
    const res = await apiClient.post<ApiSuccess<DirectorySubmission>>(
      `/${MODULE_ROUTES[module]}/${id}/reject`,
      reason ? { reason } : {}
    );
    return res.data.data;
  },
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalService, type ApprovalQueueParams } from "@/services/approval.service";
import type { DirectoryModuleKey } from "@/types";

// ─── Directory submissions + moderation queue ────────────────────────────────

export const approvalKeys = {
  all: ["approvals"] as const,
  queue: (params: ApprovalQueueParams) => ["approvals", "queue", params] as const,
};

export function useApprovalQueue(params: ApprovalQueueParams) {
  return useQuery({
    queryKey: approvalKeys.queue(params),
    queryFn: () => approvalService.listQueue(params),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}

/** Submit a new directory listing. Invalidates the queue + own submissions. */
export function useSubmitDirectory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      module,
      data,
    }: {
      module: DirectoryModuleKey;
      data: Record<string, unknown>;
    }) => approvalService.submit(module, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}

export function useApproveSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ module, id }: { module: DirectoryModuleKey; id: string }) =>
      approvalService.approve(module, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}

export function useRejectSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      module,
      id,
      reason,
    }: {
      module: DirectoryModuleKey;
      id: string;
      reason?: string;
    }) => approvalService.reject(module, id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}

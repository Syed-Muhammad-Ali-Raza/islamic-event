import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  // Event statuses
  DRAFT: "bg-slate-100 text-slate-600 border-slate-300",
  PENDING_REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  CANCELLED: "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  // Report statuses
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  REVIEWED: "bg-blue-50 text-blue-700 border-blue-200",
  DISMISSED: "bg-slate-100 text-slate-500 border-slate-300",
  ACTION_TAKEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  ACTION_TAKEN: "Action Taken",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-300"
      )}
    >
      {LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

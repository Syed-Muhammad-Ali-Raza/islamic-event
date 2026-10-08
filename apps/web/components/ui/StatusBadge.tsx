import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  // Event statuses
  DRAFT: "bg-white/10 text-white/70 border-white/20",
  PENDING_REVIEW: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40",
  APPROVED: "bg-green-900/40 text-green-400 border-green-700/40",
  REJECTED: "bg-red-900/40 text-red-400 border-red-700/40",
  CANCELLED: "bg-orange-900/40 text-orange-400 border-orange-700/40",
  COMPLETED: "bg-blue-900/40 text-blue-400 border-blue-700/40",
  // Report statuses
  PENDING: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40",
  REVIEWED: "bg-blue-900/40 text-blue-400 border-blue-700/40",
  DISMISSED: "bg-white/10 text-white/60 border-white/20",
  ACTION_TAKEN: "bg-green-900/40 text-green-400 border-green-700/40",
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
        STATUS_STYLES[status] ?? "bg-white/10 text-white/70 border-white/20"
      )}
    >
      {LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

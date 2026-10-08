"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Ban, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import { useAdminEvents, useAdminEventAction } from "@/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EventStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DRAFT", label: "Draft" },
];

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") ?? "") as EventStatus | "";
  const page = Number(searchParams.get("page") ?? 1);

  const { data, isLoading } = useAdminEvents(page, status, 10);
  const action = useAdminEventAction();

  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "status") params.delete("page");
    router.push(`/admin/events?${params.toString()}`);
  };

  const runAction = async (id: string, act: "approve" | "reject" | "cancel", reason?: string) => {
    setActionError("");
    try {
      await action.mutateAsync({ id, action: act, reason });
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      setActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Action failed."
      );
    }
  };

  const confirmReject = () => {
    if (!rejectTarget) return;
    runAction(rejectTarget.id, "reject", rejectReason || undefined);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="input w-auto text-sm py-2"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {data && (
          <span className="text-white/40 text-sm">{data.pagination.total} events</span>
        )}
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
          {actionError}
        </div>
      )}

      {/* Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Created By</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-center">Reports</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="skeleton h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/40">
                    No events found{status ? " for this status" : ""}.
                  </td>
                </tr>
              ) : (
                data.data.map((event) => (
                  <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <a
                        href={`/events/${event.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white font-medium hover:text-brand-300 transition-colors inline-flex items-center gap-1.5 max-w-xs"
                      >
                        <span className="truncate">{event.title}</span>
                        <ExternalLink size={12} className="shrink-0 text-white/30" />
                      </a>
                      <p className="text-white/40 text-xs mt-0.5">{event.category.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white/80">{event.createdBy.name}</p>
                      <p className="text-white/40 text-xs">{event.createdBy.email}</p>
                    </td>
                    <td className="px-5 py-4 text-white/60 whitespace-nowrap">
                      {format(new Date(event.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      {event._count.reports > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                          {event._count.reports}
                        </span>
                      ) : (
                        <span className="text-white/30">0</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {event.status === "PENDING_REVIEW" && (
                          <>
                            <button
                              onClick={() => runAction(event.id, "approve")}
                              disabled={action.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/40 hover:bg-green-800/40 transition-colors disabled:opacity-40"
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget({ id: event.id, title: event.title })}
                              disabled={action.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-800/40 transition-colors disabled:opacity-40"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {event.status === "APPROVED" && (
                          <button
                            onClick={() => runAction(event.id, "cancel")}
                            disabled={action.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-900/40 text-orange-400 border border-orange-700/40 hover:bg-orange-800/40 transition-colors disabled:opacity-40"
                          >
                            <Ban size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setParam("page", String(page - 1))}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-white/40 text-sm">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => setParam("page", String(page + 1))}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="card-glass w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Reject Event</h3>
                <p className="text-white/50 text-sm mt-1 line-clamp-1">{rejectTarget.title}</p>
              </div>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="label" htmlFor="reject-reason">Reason (optional)</label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tell the organizer why this event was rejected…"
              rows={3}
              className="input resize-none"
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={action.isPending}
                className="btn-primary bg-red-600 hover:bg-red-500 py-2.5 px-5"
              >
                {action.isPending ? "Rejecting…" : "Reject Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense>
      <EventsContent />
    </Suspense>
  );
}

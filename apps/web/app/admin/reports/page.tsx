"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, EyeOff, ShieldCheck, ExternalLink } from "lucide-react";
import { useAdminReports, useResolveReport } from "@/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminReports(page, 10);
  const resolve = useResolveReport();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const run = async (id: string, status: "REVIEWED" | "DISMISSED" | "ACTION_TAKEN") => {
    setPendingId(id);
    try {
      await resolve.mutateAsync({ id, status });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Event Reports</h2>
        {data && <span className="text-slate-500 text-sm">{data.pagination.total} reports</span>}
      </div>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Reported Event</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Reported By</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="skeleton h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No reports. Everything looks good! 🎉
                  </td>
                </tr>
              ) : (
                data.data.map((report) => (
                  <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={`/events/${report.event.slug}`}
                        target="_blank"
                        className="text-slate-900 font-medium hover:text-brand-700 transition-colors inline-flex items-center gap-1.5 max-w-xs"
                      >
                        <span className="truncate">{report.event.title}</span>
                        <ExternalLink size={12} className="shrink-0 text-slate-400" />
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{report.reason.replace(/_/g, " ").toLowerCase()}</p>
                      {report.description && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-[200px]">
                          “{report.description}”
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{report.user?.name ?? "Unknown"}</p>
                      <p className="text-slate-500 text-xs">{report.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {format(new Date(report.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-4">
                      {report.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => run(report.id, "REVIEWED")}
                            disabled={pendingId === report.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-800/40 transition-colors disabled:opacity-40"
                          >
                            <EyeOff size={13} /> Reviewed
                          </button>
                          <button
                            onClick={() => run(report.id, "ACTION_TAKEN")}
                            disabled={pendingId === report.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                          >
                            <ShieldCheck size={13} /> Action Taken
                          </button>
                          <button
                            onClick={() => run(report.id, "DISMISSED")}
                            disabled={pendingId === report.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-40"
                          >
                            <CheckCircle2 size={13} /> Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs text-right block">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAdminUsers, useUpdateUserStatus } from "@/hooks/useAdmin";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers(page, 10);
  const updateStatus = useUpdateUserStatus();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggle = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    try {
      await updateStatus.mutateAsync({ id, isActive });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Users</h2>
        {data && <span className="text-white/40 text-sm">{data.pagination.total} users</span>}
      </div>

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="skeleton h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-white/40">
                    No users found.
                  </td>
                </tr>
              ) : (
                data.data.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 text-xs font-bold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-white/40 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "badge-brand text-[11px]"
                            : user.role === "ORGANIZER"
                              ? "badge-gold text-[11px]"
                              : "badge text-[11px] bg-white/10 text-white/60 border border-white/10"
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/60 whitespace-nowrap">
                      {format(new Date(user.createdAt), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          user.isActive
                            ? "badge-green text-[11px]"
                            : "badge-red text-[11px]"
                        }
                      >
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggle(user.id, !user.isActive)}
                        disabled={togglingId === user.id}
                        className={
                          user.isActive
                            ? "px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-800/40 transition-colors disabled:opacity-40"
                            : "px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/40 hover:bg-green-800/40 transition-colors disabled:opacity-40"
                        }
                      >
                        {togglingId === user.id ? "Saving…" : user.isActive ? "Disable" : "Enable"}
                      </button>
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
          <span className="text-white/40 text-sm">
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

"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock, Users, Building2, Flag, XCircle, TrendingUp } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdmin";

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  const stats = [
    { label: "Pending Review", value: data?.pendingEvents, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", href: "/admin/events?status=PENDING_REVIEW" },
    { label: "Approved Events", value: data?.approvedEvents, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", href: "/admin/events?status=APPROVED" },
    { label: "Rejected Events", value: data?.rejectedEvents, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", href: "/admin/events?status=REJECTED" },
    { label: "Total Events", value: data?.totalEvents, icon: CalendarClock, color: "text-brand-400", bg: "bg-brand-500/10", href: "/admin/events" },
    { label: "Total Users", value: data?.totalUsers, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10", href: "/admin/users" },
    { label: "Organizers", value: data?.totalOrganizers, icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10", href: "/admin" },
    { label: "Pending Reports", value: data?.pendingReports, icon: Flag, color: "text-orange-400", bg: "bg-orange-500/10", href: "/admin/reports" },
    { label: "Approval Rate", value: data && data.totalEvents > 0 ? `${Math.round((data.approvedEvents / data.totalEvents) * 100)}%` : "—", icon: TrendingUp, color: "text-gold-400", bg: "bg-yellow-500/10", href: "/admin/events" },
  ];

  return (
    <div>
      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
          Failed to load dashboard stats. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="card-glass p-5 hover:border-brand-600/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={18} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {isLoading ? "—" : stat.value ?? "—"}
              </p>
              <p className="text-white/50 text-xs mt-1 group-hover:text-white/70 transition-colors">
                {stat.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-8 card-glass p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/events?status=PENDING_REVIEW" className="btn-primary text-sm py-2.5">
            <Clock size={15} /> Review Pending Events
          </Link>
          <Link href="/admin/reports" className="btn-secondary text-sm py-2.5">
            <Flag size={15} /> Handle Reports
          </Link>
          <Link href="/admin/users" className="btn-secondary text-sm py-2.5">
            <Users size={15} /> Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}

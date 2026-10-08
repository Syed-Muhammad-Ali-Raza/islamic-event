"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Bookmark, CalendarClock, PlusCircle, Settings, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { AuthGuard } from "@/components/auth/AuthGuard";

function ProfileContent() {
  const { user } = useAuthStore();

  const stats = [
    { label: "My Events", icon: CalendarClock, href: "/profile/events" },
    { label: "Saved Events", icon: Bookmark, href: "/saved" },
    { label: "Create Event", icon: PlusCircle, href: "/events/create" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Profile</h1>

      {/* Identity card */}
      <div className="card-glass p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white truncate">{user?.name}</h2>
            <p className="text-white/50 text-sm truncate">{user?.email}</p>
            <div className="mt-1.5">
              <span
                className={
                  user?.role === "ADMIN"
                    ? "badge-brand text-[11px]"
                    : user?.role === "ORGANIZER"
                      ? "badge-gold text-[11px]"
                      : "badge text-[11px] bg-white/10 text-white/60 border border-white/10"
                }
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-white/40 text-xs uppercase tracking-wider mb-1">Phone</dt>
            <dd className="text-white/90">{user?.phone ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-white/40 text-xs uppercase tracking-wider mb-1">Member Since</dt>
            <dd className="text-white/90">
              {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="card-glass p-5 hover:border-brand-600/40 transition-all group text-center"
            >
              <Icon size={20} className="mx-auto text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-white text-sm font-medium">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Admin + settings */}
      <div className="flex flex-wrap gap-3 mt-6">
        {user?.role === "ADMIN" && (
          <Link href="/admin" className="btn-primary text-sm py-2.5">
            <ShieldCheck size={15} /> Admin Panel
          </Link>
        )}
        <Link href="/profile/events" className="btn-secondary text-sm py-2.5">
          <Settings size={15} /> Manage My Events
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="container-page py-10">
        <ProfileContent />
      </div>
    </AuthGuard>
  );
}

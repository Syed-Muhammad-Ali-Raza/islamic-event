"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { PlusCircle, Calendar, MapPin } from "lucide-react";
import { useMyEvents } from "@/hooks/useEvents";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AuthGuard } from "@/components/auth/AuthGuard";

function MyEventsContent() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyEvents(page, 10);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Events</h1>
          <p className="text-white/50 text-sm mt-1">
            {data?.pagination.total
              ? `${data.pagination.total} event${data.pagination.total === 1 ? "" : "s"} you created`
              : "Events you have submitted"}
          </p>
        </div>
        <Link href="/events/create" className="btn-primary py-2.5 px-4 text-sm">
          <PlusCircle size={15} /> Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-lg font-medium text-white">No events yet</p>
          <p className="text-white/50 text-sm mt-1">
            Create your first event and it will be reviewed before going live.
          </p>
          <Link href="/events/create" className="btn-primary mt-5 inline-flex">
            <PlusCircle size={15} /> Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="card-glass p-4 flex gap-4 hover:border-brand-600/40 transition-all group"
            >
              {/* Thumb */}
              <div className="relative w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-surface-100 shrink-0">
                {event.posterUrl ? (
                  <Image
                    src={event.posterUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">🕌</div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-semibold line-clamp-1 group-hover:text-brand-300 transition-colors">
                    {event.title}
                  </h3>
                  <StatusBadge status={event.status} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-white/50 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} className="text-brand-400" />
                    {format(new Date(event.date), "dd MMM yyyy")}
                  </span>
                  {(event.venue || event.city) && (
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <MapPin size={12} className="text-brand-400" />
                      {event.venue ?? event.city?.name}
                    </span>
                  )}
                  <span className="badge-brand text-[10px]">{event.category.name}</span>
                </div>

                {event.status === "PENDING_REVIEW" && (
                  <p className="text-yellow-400/80 text-xs mt-2">
                    Awaiting admin approval — this event is not publicly visible yet.
                  </p>
                )}
                {event.status === "REJECTED" && (
                  <p className="text-red-400/80 text-xs mt-2">
                    This event was rejected by a moderator. Please review the guidelines and create a new one.
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
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

export default function MyEventsPage() {
  return (
    <AuthGuard>
      <div className="container-page py-10">
        <MyEventsContent />
      </div>
    </AuthGuard>
  );
}

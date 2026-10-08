"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { useSavedEvents, useUnsaveEvent } from "@/hooks/useEvents";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import { AuthGuard } from "@/components/auth/AuthGuard";

function SavedEventsList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSavedEvents(page, 12);
  const unsave = useUnsaveEvent();

  const items = data?.data ?? [];

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Bookmark size={26} className="text-brand-400" />
          Saved Events
        </h1>
        <p className="text-white/50 text-sm">
          {data?.pagination.total
            ? `${data.pagination.total} saved event${data.pagination.total === 1 ? "" : "s"}`
            : "Events you bookmark for later"}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-5xl mb-4">🔖</p>
          <p className="text-lg font-medium">No saved events yet</p>
          <p className="text-sm mt-1">
            Browse events and tap the bookmark icon to save them here.
          </p>
          <Link href="/events" className="btn-secondary mt-5 text-sm">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(({ id, event }) => (
            <div key={id} className="relative group">
              <EventCard event={event} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  unsave.mutate(event.id);
                }}
                disabled={unsave.isPending}
                aria-label={`Remove ${event.title} from saved`}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-red-400 hover:border-red-500/40 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
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

export default function SavedEventsPage() {
  return (
    <AuthGuard>
      <SavedEventsList />
    </AuthGuard>
  );
}

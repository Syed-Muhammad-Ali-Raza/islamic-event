"use client";

import Link from "next/link";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/ui/Skeleton";

export function FeaturedEvents() {
  const { data, isLoading } = useEvents({ limit: 6 });

  return (
    <section aria-labelledby="upcoming-events-heading">
      <div className="flex items-center justify-between mb-8">
        <h2 id="upcoming-events-heading" className="text-2xl font-bold text-white">
          Upcoming Events
        </h2>
        <Link href="/events" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
          : data?.data.length === 0
            ? (
                <div className="col-span-full text-center py-16 text-white/40">
                  <p className="text-4xl mb-3">📅</p>
                  <p>No upcoming events. Be the first to add one!</p>
                  <Link href="/events/create" className="btn-primary mt-4 inline-flex">
                    Add Event
                  </Link>
                </div>
              )
            : data?.data.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
      </div>
    </section>
  );
}

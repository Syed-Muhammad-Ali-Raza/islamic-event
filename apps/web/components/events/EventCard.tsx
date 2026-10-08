import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import type { EventSummary } from "@/types";
import { clsx } from "clsx";

interface Props {
  event: EventSummary;
  className?: string;
}

export function EventCard({ event, className }: Props) {
  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "dd MMM yyyy");
  const isPast = eventDate < new Date();

  return (
    <Link
      href={`/events/${event.slug}`}
      className={clsx(
        "group block card-glass overflow-hidden hover:border-brand-600/40 hover:-translate-y-1 transition-all duration-300",
        className
      )}
      id={`event-card-${event.id}`}
    >
      {/* Poster */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
        {event.posterUrl ? (
          <Image
            src={event.posterUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-900/60 to-surface-100">
            <span className="text-4xl opacity-40">🕌</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="badge-brand text-[10px] px-2 py-0.5">
            {event.category.name}
          </span>
        </div>

        {/* Featured */}
        {event.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="badge-gold text-[10px] px-2 py-0.5">Featured</span>
          </div>
        )}

        {/* Past event overlay */}
        {isPast && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white/60 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
              Event Ended
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Calendar size={12} className="shrink-0 text-brand-400" />
            <span>{formattedDate}</span>
            {event.startTime && (
              <>
                <Clock size={12} className="shrink-0 text-brand-400 ml-1" />
                <span>{event.startTime}</span>
              </>
            )}
          </div>

          {(event.venue ?? event.city) && (
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin size={12} className="shrink-0 text-brand-400" />
              <span className="line-clamp-1">
                {event.venue ?? event.city?.name}
              </span>
            </div>
          )}
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
            {event.organizer.logoUrl ? (
              <Image
                src={event.organizer.logoUrl}
                alt={event.organizer.name}
                width={18}
                height={18}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-brand-800 flex items-center justify-center text-[8px] text-brand-300 font-bold">
                {event.organizer.name.charAt(0)}
              </div>
            )}
            <span className="text-white/40 text-xs truncate">{event.organizer.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

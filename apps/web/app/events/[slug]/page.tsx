import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, isPast } from "date-fns";
import { Calendar, Clock, MapPin, Eye, Users, Building2, ExternalLink } from "lucide-react";
import { EventActions } from "@/components/events/EventActions";
import type { Event } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function fetchEvent(slug: string): Promise<Event | null> {
  try {
    const res = await fetch(`${API_URL}/events/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as Event | null;
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  if (!event) {
    return { title: "Event not found" };
  }

  const description =
    event.description?.slice(0, 160) ||
    `${event.title} — ${format(new Date(event.date), "EEEE, dd MMMM yyyy")}${
      event.venue ? ` at ${event.venue}` : ""
    }. Discover religious and community events near you.`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.posterUrl ? [{ url: event.posterUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  if (!event) notFound();

  const eventDate = new Date(event.date);
  const startDateISO = `${event.date}T${event.startTime ?? "00:00"}:00`;
  const endDateISO = event.endTime ? `${event.date}T${event.endTime}:00` : undefined;
  const ended = isPast(new Date(`${event.date}T${event.endTime ?? "23:59"}:00`));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: startDateISO,
    endDate: endDateISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.posterUrl ?? undefined,
    location: event.venue
      ? {
          "@type": "Place",
          name: event.venue,
          address: event.address ?? undefined,
        }
      : event.address
        ? { "@type": "Place", name: event.address }
        : undefined,
    organizer: event.organizer
      ? { "@type": "Organization", name: event.organizer.name }
      : undefined,
  };

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-white/40 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/events" className="hover:text-white transition-colors">Events</Link>
        <span>/</span>
        <span className="text-white/70 line-clamp-1">{event.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Poster */}
          {event.posterUrl && (
            <div className="relative aspect-[4/3] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-surface-100">
              <Image
                src={event.posterUrl}
                alt={event.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              {ended && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white/70 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    Event Ended
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Link href={`/categories/${event.category.slug}`} className="badge-brand text-xs">
                {event.category.name}
              </Link>
              {event.isFeatured && <span className="badge-gold text-xs">Featured</span>}
              <span className="inline-flex items-center gap-1 text-white/40 text-xs">
                <Eye size={12} /> {event.viewCount} views
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight text-balance">
              {event.title}
            </h1>

            <div className="mt-5">
              <EventActions eventId={event.id} />
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="card-glass p-6">
              <h2 className="text-lg font-semibold text-white mb-3">About this event</h2>
              <p className="text-white/70 leading-relaxed whitespace-pre-line text-[15px]">
                {event.description}
              </p>
            </div>
          )}

          {/* Participants */}
          {event.participants.length > 0 && (
            <div className="card-glass p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users size={17} className="text-brand-400" /> Participants
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    {p.person.profileImage ? (
                      <Image
                        src={p.person.profileImage}
                        alt={p.person.name}
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 text-sm font-bold shrink-0">
                        {p.person.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.person.name}</p>
                      <p className="text-brand-300/80 text-xs capitalize">
                        {p.role.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Event facts */}
          <div className="card-glass p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar size={17} className="text-brand-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">
                  {format(eventDate, "EEEE, dd MMMM yyyy")}
                </p>
                <p className="text-white/40 text-xs mt-0.5">Event date</p>
              </div>
            </div>

            {(event.startTime || event.endTime) && (
              <div className="flex items-start gap-3">
                <Clock size={17} className="text-brand-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">
                    {event.startTime ?? "?"} {event.endTime ? `– ${event.endTime}` : ""}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">Timing</p>
                </div>
              </div>
            )}

            {(event.venue || event.address || event.city) && (
              <div className="flex items-start gap-3">
                <MapPin size={17} className="text-brand-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{event.venue ?? event.city?.name ?? "TBA"}</p>
                  {event.address && (
                    <p className="text-white/40 text-xs mt-0.5">{event.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="card-glass p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-brand-400" /> Organized by
              </h3>
              <div className="flex items-center gap-3">
                {event.organizer.logoUrl ? (
                  <Image
                    src={event.organizer.logoUrl}
                    alt={event.organizer.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 font-bold">
                    {event.organizer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-medium">{event.organizer.name}</p>
                  <Link
                    href={`/organizers?search=${encodeURIComponent(event.organizer.name)}`}
                    className="text-brand-400 text-xs hover:text-brand-300 inline-flex items-center gap-1"
                  >
                    More events <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Location map link */}
          {event.latitude != null && event.longitude != null && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full"
            >
              <MapPin size={15} /> Open in Google Maps
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

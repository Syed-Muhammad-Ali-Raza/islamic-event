import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Globe, Mail, MapPin, Phone } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { fetchFromApi, fetchPaginated } from "@/lib/server-api";
import type { EventSummary } from "@/types";
import type { OrganizerListItem } from "@/services/organizer.service";

type OrganizerDetail = OrganizerListItem & {
  _count: { events: number };
};

interface Props {
  params: Promise<{ slug: string }>;
}

async function getData(slug: string) {
  const [organizer, events] = await Promise.all([
    fetchFromApi<OrganizerDetail>(`/organizers/${encodeURIComponent(slug)}`, 300),
    fetchPaginated<EventSummary>(`/events?organizer=${encodeURIComponent(slug)}&limit=24`, 60),
  ]);
  return { organizer, events };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { organizer } = await getData(slug);

  if (!organizer) notFound();

  const location = [organizer.city?.name, organizer.country?.name].filter(Boolean).join(", ");

  return {
    title: `${organizer.name} — Organizer`,
    description:
      organizer.description ??
      `${organizer.name}${location ? ` — events in ${location}` : ""}. Discover upcoming events published by this organizer.`,
  };
}

export default async function OrganizerDetailPage({ params }: Props) {
  const { slug } = await params;
  const { organizer, events } = await getData(slug);

  if (!organizer) notFound();

  const eventList = events?.data ?? [];
  const location = [organizer.city?.name, organizer.country?.name].filter(Boolean).join(", ");
  const websiteHref = organizer.website
    ? organizer.website.startsWith("http")
      ? organizer.website
      : `https://${organizer.website}`
    : null;

  return (
    <div className="container-page py-10">
      <Link
        href="/organizers"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-brand-700 text-sm transition-colors mb-6"
      >
        <ArrowLeft size={14} /> All organizers
      </Link>

      {/* Header */}
      <div className="card-glass p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {organizer.logoUrl ? (
            <Image
              src={organizer.logoUrl}
              alt={organizer.name}
              width={80}
              height={80}
              className="rounded-full object-cover shrink-0 w-20 h-20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {organizer.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{organizer.name}</h1>
              {organizer.isVerified && (
                <span className="badge-brand text-[11px] inline-flex items-center gap-1">
                  <BadgeCheck size={12} /> Verified
                </span>
              )}
            </div>

            {location && (
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                <MapPin size={13} /> {location}
              </p>
            )}

            <p className="text-brand-700 text-sm mt-1">
              {organizer._count.events} published event{organizer._count.events === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {organizer.description && (
          <p className="text-slate-600 text-sm mt-5 leading-relaxed">{organizer.description}</p>
        )}

        {(organizer.address || organizer.email || websiteHref || organizer.phone) && (
          <>
            <div className="divider" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {organizer.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand-600 shrink-0" /> {organizer.address}
                </span>
              )}
              {organizer.email && (
                <a
                  href={`mailto:${organizer.email}`}
                  className="flex items-center gap-1.5 hover:text-brand-700 transition-colors"
                >
                  <Mail size={14} className="text-brand-600 shrink-0" /> {organizer.email}
                </a>
              )}
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-brand-700 transition-colors"
                >
                  <Globe size={14} className="text-brand-600 shrink-0" /> {organizer.website}
                </a>
              )}
              {organizer.phone && (
                <a
                  href={`tel:${organizer.phone}`}
                  className="flex items-center gap-1.5 hover:text-brand-700 transition-colors"
                >
                  <Phone size={14} className="text-brand-600 shrink-0" /> {organizer.phone}
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Events */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Events by {organizer.name}
      </h2>

      {eventList.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🌙</p>
          <p className="text-lg font-medium">No published events right now</p>
          <p className="text-sm mt-1">Check back soon for upcoming gatherings.</p>
          <Link href="/events" className="btn-secondary mt-5 inline-flex">
            Browse all events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {eventList.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

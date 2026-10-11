import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapPinned, CalendarDays, Soup, Landmark, LandPlot, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { CityMap } from "@/components/maps/CityMap";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi, fetchList } from "@/lib/server-api";
import type {
  CityDetail,
  Darbar,
  Dastarkhwan,
  EventSummary,
  Imambargah,
  Place,
  Procession,
} from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCity(slug: string) {
  return fetchFromApi<CityDetail>(`/cities/${encodeURIComponent(slug)}`, 300);
}

async function getDirectoryData(cityName: string, slug: string) {
  const [events, dastarkhwans, imambargahs, places, darbars, processions] = await Promise.all([
    fetchList<EventSummary>(`/events?city=${encodeURIComponent(slug)}&limit=12`, 60),
    fetchList<Dastarkhwan>(`/dastarkhwans?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Imambargah>(`/imambargahs?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Place>(`/places?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Darbar>(`/darbars?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Procession>(`/processions?city=${encodeURIComponent(cityName)}&limit=50`, 300),
  ]);
  return {
    events: events?.data ?? [],
    eventTotal: events?.pagination.total ?? 0,
    dastarkhwans: dastarkhwans?.data ?? [],
    imambargahs: imambargahs?.data ?? [],
    places: places?.data ?? [],
    darbars: darbars?.data ?? [],
    processions: processions?.data ?? [],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCity(slug);
  if (!city) return { title: "City not found" };

  const title = `${city.name} — Events, Places & Community`;
  const description = `Discover religious and community events in ${city.name}, ${city.state} — Majlis, Milad, Dars and more, plus free food points, imambargahs and places. ${city.eventCount} event${city.eventCount === 1 ? "" : "s"} listed.`;

  return {
    title,
    description,
    alternates: { canonical: `/cities/${city.slug}` },
    openGraph: { title: `${title} | Community Events`, description, url: `/cities/${city.slug}` },
  };
}

function HeroSkeleton() {
  return (
    <div className="container-page py-10">
      <div className="skeleton h-8 w-64 mb-2" />
      <div className="skeleton h-4 w-96 mb-8" />
      <div className="skeleton h-[420px] sm:h-[520px] w-full rounded-2xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-72 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

async function CityHub({ slug }: { slug: string }) {
  const city = await getCity(slug);
  if (!city) notFound();

  const data = await getDirectoryData(city.name, city.slug);

  const hasDirectoryData =
    data.dastarkhwans.length > 0 ||
    data.imambargahs.length > 0 ||
    data.places.length > 0 ||
    data.darbars.length > 0 ||
    data.processions.length > 0;

  return (
    <div className="container-page py-10">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cities", path: "/cities" },
            { name: city.name, path: `/cities/${city.slug}` },
          ]),
          ...(data.events.length > 0
            ? [
                itemListJsonLd(
                  `Upcoming events in ${city.name}`,
                  data.events.map((e) => ({ name: e.title, path: `/events/${e.slug}` }))
                ),
              ]
            : []),
        ]}
      />

      {/* Breadcrumb UI */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/cities" className="hover:text-slate-900 transition-colors">Cities</Link>
        <span>/</span>
        <span className="text-slate-600">{city.name}</span>
      </nav>

      {/* Hero */}
      <div className="card-glass p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 inline-flex items-center gap-2.5">
              <MapPinned size={28} className="text-brand-600" /> Events in {city.name}
            </h1>
            <p className="text-slate-500 text-sm mt-2">{city.state}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3.5 py-2 text-sm font-medium text-brand-700">
              <CalendarDays size={15} />
              {city.eventCount} event{city.eventCount === 1 ? "" : "s"}
            </span>
            <Link href={`/events?city=${encodeURIComponent(city.slug)}`} className="btn-primary py-2 px-4 text-sm">
              Browse all events <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Category breakdown */}
        {city.categoryCounts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-200/70">
            {city.categoryCounts.map((cc) => (
              <Link
                key={cc.category.id}
                href={`/events?category=${encodeURIComponent(cc.category.slug)}&city=${encodeURIComponent(city.slug)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
              >
                {cc.category.name}
                <span className="text-brand-700 font-semibold">{cc.count}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <section aria-labelledby="city-map-heading" className="mb-10">
        <h2 id="city-map-heading" className="text-xl font-bold text-slate-900 mb-4">
          Map of {city.name}
        </h2>
        <CityMap
          events={data.events}
          dastarkhwans={data.dastarkhwans}
          imambargahs={data.imambargahs}
        />
      </section>

      {/* Events */}
      <section aria-labelledby="city-events-heading" className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 id="city-events-heading" className="text-xl font-bold text-slate-900">
            Upcoming events
          </h2>
          {data.eventTotal > 0 && (
            <Link
              href={`/events?city=${encodeURIComponent(city.slug)}`}
              className="text-brand-600 hover:text-brand-700 text-sm transition-colors"
            >
              View all {data.eventTotal} →
            </Link>
          )}
        </div>

        {data.events.length === 0 ? (
          <div className="card-glass text-center py-14 px-6">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-lg font-medium text-slate-900">No events in {city.name} yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Be the first — publish an event for your community.
            </p>
            <Link href="/events/create" className="btn-primary mt-5 inline-flex">
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Directory links */}
      <section aria-labelledby="city-explore-heading">
        <h2 id="city-explore-heading" className="text-xl font-bold text-slate-900 mb-4">
          Explore {city.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dastarkhwan"
            className="card-glass p-5 hover:border-brand-600/50 hover:-translate-y-1 transition-all"
          >
            <Soup size={20} className="text-amber-600 mb-2" />
            <p className="font-semibold text-slate-900 text-sm">Free Dastarkhwan</p>
            <p className="text-slate-500 text-xs mt-1">
              {data.dastarkhwans.length > 0
                ? `${data.dastarkhwans.length} point${data.dastarkhwans.length === 1 ? "" : "s"} in ${city.name}`
                : "Free food points"}
            </p>
          </Link>
          <Link
            href="/imambargahs"
            className="card-glass p-5 hover:border-brand-600/50 hover:-translate-y-1 transition-all"
          >
            <Landmark size={20} className="text-rose-600 mb-2" />
            <p className="font-semibold text-slate-900 text-sm">Imambargahs</p>
            <p className="text-slate-500 text-xs mt-1">
              {data.imambargahs.length > 0
                ? `${data.imambargahs.length} listed in ${city.name}`
                : "Historic imambargahs"}
            </p>
          </Link>
          <Link
            href="/darbars"
            className="card-glass p-5 hover:border-brand-600/50 hover:-translate-y-1 transition-all"
          >
            <Landmark size={20} className="text-teal-600 mb-2" />
            <p className="font-semibold text-slate-900 text-sm">Darbars & Urs</p>
            <p className="text-slate-500 text-xs mt-1">
              {data.darbars.length > 0
                ? `${data.darbars.length} shrine${data.darbars.length === 1 ? "" : "s"} in ${city.name}`
                : "Shrines & urs calendar"}
            </p>
          </Link>
          <Link
            href="/places"
            className="card-glass p-5 hover:border-brand-600/50 hover:-translate-y-1 transition-all"
          >
            <LandPlot size={20} className="text-sky-600 mb-2" />
            <p className="font-semibold text-slate-900 text-sm">Places</p>
            <p className="text-slate-500 text-xs mt-1">
              {data.places.length > 0
                ? `${data.places.length} place${data.places.length === 1 ? "" : "s"} in ${city.name}`
                : "Historical & cultural places"}
            </p>
          </Link>
        </div>

        {/* Processions notice — Muharram city */}
        {data.processions.length > 0 && (
          <Link
            href="/categories/muharram"
            className="mt-4 card-glass p-5 flex items-center justify-between hover:border-brand-600/50 transition-all"
          >
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                Muharram jaloos in {city.name}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {data.processions.length} procession{data.processions.length === 1 ? "" : "s"} with
                routes &amp; timings
              </p>
            </div>
            <ArrowRight size={16} className="text-brand-600" />
          </Link>
        )}

        {!hasDirectoryData && (
          <p className="text-xs text-slate-400 mt-4">
            Directory data for {city.name} is being curated — check back soon.
          </p>
        )}
      </section>
    </div>
  );
}

export default async function CityHubPage({ params }: Props) {
  const { slug } = await params;

  return (
    <Suspense fallback={<HeroSkeleton />}>
      <CityHub slug={slug} />
    </Suspense>
  );
}

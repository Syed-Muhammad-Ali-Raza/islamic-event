import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapPinned, Soup, Landmark, LandPlot, Ticket, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { CityMapLazy } from "@/components/maps/CityMapLazy";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi, fetchList } from "@/lib/server-api";
import type {
  CityDetail,
  Darbar,
  Dastarkhwan,
  EventSummary,
  Imambargah,
  Mela,
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
  const [events, dastarkhwans, imambargahs, places, darbars, processions, melas] = await Promise.all([
    fetchList<EventSummary>(`/events?city=${encodeURIComponent(slug)}&limit=12`, 60),
    fetchList<Dastarkhwan>(`/dastarkhwans?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Imambargah>(`/imambargahs?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Place>(`/places?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Darbar>(`/darbars?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Procession>(`/processions?city=${encodeURIComponent(cityName)}&limit=50`, 300),
    fetchList<Mela>(`/melas?city=${encodeURIComponent(cityName)}&limit=50`, 300),
  ]);
  return {
    events: events?.data ?? [],
    eventTotal: events?.pagination.total ?? 0,
    dastarkhwans: dastarkhwans?.data ?? [],
    imambargahs: imambargahs?.data ?? [],
    places: places?.data ?? [],
    darbars: darbars?.data ?? [],
    processions: processions?.data ?? [],
    melas: melas?.data ?? [],
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
    data.processions.length > 0 ||
    data.melas.length > 0;

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

      {/* Hero — plain page header, not a card */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 inline-flex items-center gap-2.5">
            <MapPinned size={28} className="text-brand-600" /> Events in {city.name}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {city.state} · {city.eventCount} event{city.eventCount === 1 ? "" : "s"}
            {data.dastarkhwans.length > 0 &&
              ` · ${data.dastarkhwans.length} dastarkhwan point${data.dastarkhwans.length === 1 ? "" : "s"}`}
            {data.imambargahs.length > 0 &&
              ` · ${data.imambargahs.length} imambargah${data.imambargahs.length === 1 ? "" : "s"}`}
            {data.darbars.length > 0 &&
              ` · ${data.darbars.length} shrine${data.darbars.length === 1 ? "" : "s"}`}
            {data.places.length > 0 &&
              ` · ${data.places.length} place${data.places.length === 1 ? "" : "s"}`}
            {data.melas.length > 0 && ` · ${data.melas.length} mela${data.melas.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href={`/events?city=${encodeURIComponent(city.slug)}`}
          className="btn-primary py-2 px-4 text-sm shrink-0"
        >
          Browse all events <ArrowRight size={14} />
        </Link>
      </div>

      {/* Category breakdown */}
      {city.categoryCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-slate-200/70">
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

      {/* Map */}
      <section aria-labelledby="city-map-heading" className="mb-10">
        <h2 id="city-map-heading" className="text-xl font-bold text-slate-900 mb-4">
          Map of {city.name}
        </h2>
        <CityMapLazy
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

      {/* Directory links — compact index rows, not cards */}
      <section aria-labelledby="city-explore-heading">
        <h2 id="city-explore-heading" className="text-xl font-bold text-slate-900 mb-4">
          Explore {city.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-t border-slate-100">
          {[
            {
              href: "/dastarkhwan",
              icon: Soup,
              iconCls: "text-amber-600",
              label: "Free Dastarkhwan",
              meta:
                data.dastarkhwans.length > 0
                  ? `${data.dastarkhwans.length} point${data.dastarkhwans.length === 1 ? "" : "s"} in ${city.name}`
                  : "Free food points",
            },
            {
              href: "/imambargahs",
              icon: Landmark,
              iconCls: "text-rose-600",
              label: "Imambargahs",
              meta:
                data.imambargahs.length > 0
                  ? `${data.imambargahs.length} listed in ${city.name}`
                  : "Historic imambargahs",
            },
            {
              href: "/darbars",
              icon: Landmark,
              iconCls: "text-teal-600",
              label: "Darbars & Urs",
              meta:
                data.darbars.length > 0
                  ? `${data.darbars.length} shrine${data.darbars.length === 1 ? "" : "s"} in ${city.name}`
                  : "Shrines & urs calendar",
            },
            {
              href: "/places",
              icon: LandPlot,
              iconCls: "text-sky-600",
              label: "Places",
              meta:
                data.places.length > 0
                  ? `${data.places.length} place${data.places.length === 1 ? "" : "s"} in ${city.name}`
                  : "Historical & cultural places",
            },
            {
              href: `/melas?city=${encodeURIComponent(city.name)}`,
              icon: Ticket,
              iconCls: "text-gold-400",
              label: "Melas & Festivals",
              meta:
                data.melas.length > 0
                  ? `${data.melas.length} mela${data.melas.length === 1 ? "" : "s"} in ${city.name}`
                  : "Melas & seasonal festivals",
            },
          ].map(({ href, icon: Icon, iconCls, label, meta }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center justify-between gap-3 py-3.5 border-b border-slate-100 text-slate-700 hover:text-brand-700 transition-colors"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon size={17} className={iconCls} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{label}</span>
                  <span className="block text-xs text-slate-500 truncate">{meta}</span>
                </span>
              </span>
              <ArrowRight size={15} className="shrink-0 text-slate-300 group-hover:text-brand-600 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Processions notice — Muharram city */}
        {data.processions.length > 0 && (
          <Link
            href="/categories/muharram"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200/70 px-4 py-3.5 hover:border-brand-600/50 transition-all"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">
                Muharram jaloos in {city.name}
              </span>
              <span className="block text-xs text-slate-500">
                {data.processions.length} procession{data.processions.length === 1 ? "" : "s"} with
                routes &amp; timings
              </span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-brand-600" />
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

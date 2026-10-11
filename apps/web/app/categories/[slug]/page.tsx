import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryEvents } from "@/components/events/CategoryEvents";
import { MuharramJaloos } from "@/components/events/MuharramJaloos";
import { CharityDirectory } from "@/components/events/CharityDirectory";
import { UpcomingUrs } from "@/components/events/UpcomingUrs";
import { CATEGORY_ICONS } from "@/lib/constants";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi, fetchList, fetchPaginated, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Category, Charity, EventSummary, Procession, UrsDate } from "@/types";

interface SearchParams {
  search?: string;
  page?: string;
  pq?: string;
  pcity?: string;
  pmonth?: string;
  ppage?: string;
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

async function getCategory(slug: string) {
  return fetchFromApi<Category & { _count?: { events: number } }>(
    `/categories/${slug}`,
    300
  );
}

async function getData(slug: string, sp: SearchParams) {
  const search = (sp.search ?? "").trim();
  const page = sanitizePage(sp.page);
  const pq = (sp.pq ?? "").trim();
  const pcity = (sp.pcity ?? "").trim();
  const pmonth = (sp.pmonth ?? "").trim();
  const ppage = sanitizePage(sp.ppage);

  const [events, processions, charities, ursDates] = await Promise.all([
    fetchList<EventSummary>(
      `/events?${buildQuery({ category: slug, search, page, limit: 24 })}`,
      60
    ),
    slug === "muharram"
      ? fetchList<Procession>(
          `/processions?${buildQuery({ q: pq, city: pcity, month: pmonth, page: ppage, limit: 24 })}`,
          60
        )
      : Promise.resolve(null),
    slug === "charity"
      ? fetchPaginated<Charity>("/charities?limit=200", 60)
      : Promise.resolve(null),
    slug === "urs"
      ? fetchPaginated<UrsDate>("/urs-dates?limit=100", 60)
      : Promise.resolve(null),
  ]);
  return { events, processions, charities, ursDates };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) return { title: "Category not found" };

  return {
    title: `${category.name} Events`,
    description:
      category.description ??
      `Discover ${category.name} events — gatherings, community programmes and more.`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} Events | Community Events`,
      description:
        category.description ??
        `Discover ${category.name} events — gatherings, community programmes and more.`,
      url: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const [category, { events, processions, charities, ursDates }] = await Promise.all([
    getCategory(slug),
    getData(slug, sp),
  ]);

  if (!category) notFound();

  const eventList = events?.data ?? [];
  const processionList = processions?.data ?? [];
  const charityList = charities?.data ?? [];
  const charityCountries = Array.from(new Set(charityList.map((c) => c.country))).sort();
  const ursList = ursDates?.data ?? [];

  const currentQuery = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => typeof v === "string" && v) as [string, string][]
  ).toString();

  const seedSearch = (sp.search ?? "").trim();
  const seedPage = sanitizePage(sp.page);
  const seedPq = (sp.pq ?? "").trim();
  const seedPcity = (sp.pcity ?? "").trim();
  const seedPmonth = (sp.pmonth ?? "").trim();
  const seedPpage = sanitizePage(sp.ppage);

  return (
    <div className="container-page py-10">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
            { name: category.name, path: `/categories/${category.slug}` },
          ]),
          ...(eventList.length > 0
            ? [
                itemListJsonLd(
                  `${category.name} events`,
                  eventList.map((e) => ({ name: e.title, path: `/events/${e.slug}` }))
                ),
              ]
            : []),
        ]}
      />
      {/* Header */}
      <div className="card-glass p-6 sm:p-8 mb-8 text-center">
        <div className="text-5xl mb-3">{CATEGORY_ICONS[category.slug] ?? "📅"}</div>
        <h1 className="text-3xl font-bold text-slate-900">{category.name}</h1>
        {category.description && (
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto leading-relaxed">
            {category.description}
          </p>
        )}
        <p className="text-brand-700 text-sm mt-3">
          {events?.pagination?.total ?? eventList.length} event
          {(events?.pagination?.total ?? eventList.length) === 1 ? "" : "s"} found
        </p>
      </div>

      {/* Events grid — search + pagination wired to searchParams */}
      <CategoryEvents
        slug={category.slug}
        categoryId={category.id}
        categoryName={category.name}
        initialData={events ?? undefined}
        seed={{ search: seedSearch, page: seedPage }}
        currentQuery={currentQuery}
      />

      {/* Muharram procession (jaloos) routes — only on the Muharram category page */}
      {slug === "muharram" && (
        <MuharramJaloos
          initialData={processions ?? undefined}
          seed={{ q: seedPq, city: seedPcity, month: seedPmonth, page: seedPpage }}
          currentQuery={currentQuery}
        />
      )}

      {/* Charity directory — only on the Charity category page */}
      {charityList.length > 0 && (
        <CharityDirectory charities={charityList} countries={charityCountries} />
      )}

      {/* Upcoming Urs calendar — only on the Urs category page */}
      {ursList.length > 0 && <UpcomingUrs dates={ursList} />}
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsExplorer } from "@/components/events/EventsExplorer";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { fetchFromApi, fetchList, buildQuery, sanitizePage } from "@/lib/server-api";
import type { Category, EventSummary } from "@/types";

interface Props {
  searchParams: Promise<{ search?: string; category?: string; city?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { search, category, city } = await searchParams;
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (city) qs.set("city", city);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const title = search
    ? `Events matching “${search}”`
    : city
      ? `Events in ${city}`
      : category
        ? `Events — ${category}`
        : "Discover Events";
  const description = search
    ? `Browse religious and community events matching “${search}” — Majlis, Milad, Dars and more.`
    : city
      ? `Browse upcoming religious and community events in ${city} — Majlis, Milad, Dars, Urs and more.`
      : "Search and filter religious and community events — Majlis, Milad, Dars, Quran Khwani, Iftar, Urs and more, near you.";

  return {
    title,
    description,
    alternates: { canonical: `/events${suffix}` },
    openGraph: {
      title: `${title} | Community Events`,
      description,
      url: `/events${suffix}`,
    },
  };
}

async function getData(search?: string, category?: string, city?: string, page = 1) {
  const qs = buildQuery({
    search,
    category,
    city,
    page,
    limit: 12,
  });

  const [events, categories] = await Promise.all([
    fetchList<EventSummary>(`/events?${qs}`, 60),
    fetchFromApi<Category[]>("/categories", 300),
  ]);
  return { events, categories: categories ?? [] };
}

export default async function EventsPage({ searchParams }: Props) {
  const { search, category, city, page: pageRaw } = await searchParams;
  const page = sanitizePage(pageRaw);
  const { events, categories } = await getData(search, category, city, page);

  const eventEntries = (events?.data ?? []).map((e) => ({
    name: e.title,
    path: `/events/${e.slug}`,
  }));

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
          ]),
          ...(eventEntries.length > 0
            ? [itemListJsonLd("Upcoming events", eventEntries)]
            : []),
        ]}
      />
      <Suspense
      fallback={
        <div className="container-page py-8">
          <div className="skeleton h-8 w-40 mb-2" />
          <div className="skeleton h-4 w-56 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <EventsExplorer
        initialData={events ?? undefined}
        categories={categories}
        seed={{ search: search ?? "", category: category ?? "", city: city ?? "", page }}
      />
      </Suspense>
    </>
  );
}

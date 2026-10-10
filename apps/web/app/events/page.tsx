import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsExplorer } from "@/components/events/EventsExplorer";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import { fetchFromApi, fetchList } from "@/lib/server-api";
import type { Category, EventSummary } from "@/types";

interface Props {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { search, category } = await searchParams;
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const title = search
    ? `Events matching “${search}”`
    : category
      ? `Events — ${category}`
      : "Discover Events";
  const description = search
    ? `Browse religious and community events matching “${search}” — Majlis, Milad, Dars and more.`
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

async function getData(search?: string, category?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  params.set("page", "1");
  params.set("limit", "12");
  const qs = params.toString();

  const [events, categories] = await Promise.all([
    fetchList<EventSummary>(`/events?${qs}`, 60),
    fetchFromApi<Category[]>("/categories", 300),
  ]);
  return { events, categories: categories ?? [] };
}

export default async function EventsPage({ searchParams }: Props) {
  const { search, category } = await searchParams;
  const { events, categories } = await getData(search, category);

  return (
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
      <EventsExplorer initialData={events ?? undefined} categories={categories} />
    </Suspense>
  );
}

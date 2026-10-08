import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/events/EventCard";
import { CATEGORY_ICONS } from "@/lib/constants";
import { fetchFromApi, fetchPaginated } from "@/lib/server-api";
import type { Category, EventSummary } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getData(slug: string) {
  const [category, events] = await Promise.all([
    fetchFromApi<Category & { _count?: { events: number } }>(`/categories/${slug}`, 300),
    fetchPaginated<EventSummary>(`/events?category=${encodeURIComponent(slug)}&limit=24`, 60),
  ]);
  return { category, events };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getData(slug);

  if (!category) return { title: "Category not found" };

  return {
    title: `${category.name} Events`,
    description:
      category.description ??
      `Discover ${category.name} events — gatherings, community programmes and more.`,
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const { category, events } = await getData(slug);

  if (!category) notFound();

  const eventList = events?.data ?? [];

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="card-glass p-6 sm:p-8 mb-8 text-center">
        <div className="text-5xl mb-3">{CATEGORY_ICONS[category.slug] ?? "📅"}</div>
        <h1 className="text-3xl font-bold text-white">{category.name}</h1>
        {category.description && (
          <p className="text-white/50 text-sm mt-2 max-w-xl mx-auto leading-relaxed">
            {category.description}
          </p>
        )}
        <p className="text-brand-300 text-sm mt-3">
          {events?.pagination?.total ?? eventList.length} event
          {(events?.pagination?.total ?? eventList.length) === 1 ? "" : "s"} found
        </p>
      </div>

      {/* Events */}
      {eventList.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="text-4xl mb-3">🌙</p>
          <p className="text-lg font-medium">No {category.name} events right now</p>
          <p className="text-sm mt-1">Check back soon — or be the first to publish one.</p>
          <Link href={`/events/create?category=${category.id}`} className="btn-primary mt-5 inline-flex">
            Create Event
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

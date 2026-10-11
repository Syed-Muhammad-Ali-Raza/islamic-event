"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import type { EventSummary, PaginatedResponse } from "@/types";

interface Props {
  slug: string;
  categoryId: string;
  categoryName: string;
  initialData?: PaginatedResponse<EventSummary>;
  seed: { search: string; page: number };
  currentQuery: string;
}

export function CategoryEvents({
  slug,
  categoryId,
  categoryName,
  initialData,
  seed,
  currentQuery,
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState(seed.search);
  const [search, setSearch] = useState(seed.search);
  const [page, setPage] = useState(seed.page);

  useEffect(() => {
    setInput(seed.search);
    setSearch(seed.search);
    setPage(seed.page);
  }, [seed.search, seed.page]);

  const seedMatch = page === seed.page && search === seed.search;
  const { data, isLoading } = useEvents(
    { search: search || undefined, category: slug, page, limit: 24 },
    seedMatch ? initialData : undefined
  );

  const pushUrl = (next: { page: number; search?: string }) => {
    const params = new URLSearchParams(currentQuery);
    const nq = next.search ?? search;
    if (nq) params.set("search", nq);
    else params.delete("search");
    if (next.page > 1) params.set("page", String(next.page));
    else params.delete("page");
    router.push(`/categories/${slug}?${params.toString()}`);
  };

  const applySearch = () => {
    setPage(1);
    setSearch(input);
    pushUrl({ page: 1, search: input });
  };

  const clearSearch = () => {
    setPage(1);
    setSearch("");
    setInput("");
    pushUrl({ page: 1, search: "" });
  };

  const gotoPage = (p: number) => {
    setPage(p);
    pushUrl({ page: p });
  };

  const total = data?.pagination.total ?? 0;
  const isFiltered = Boolean(search);

  return (
    <section aria-labelledby="category-events-heading" className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 id="category-events-heading" className="text-xl font-bold text-slate-900">
          {isFiltered ? `Events matching “${search}”` : "Events"}
        </h2>

        <div className="flex gap-3 w-full sm:w-auto max-w-sm">
          <div className="flex-1 flex items-center gap-3 input px-4 py-2.5">
            <Search size={15} className="text-brand-600 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder={`Search ${categoryName} events…`}
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              aria-label={`Search ${categoryName} events`}
            />
            {input && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="button" onClick={applySearch} className="btn-primary px-4 py-2.5 text-sm">
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg font-medium">
            {isFiltered ? "No events match your search" : `No ${categoryName} events right now`}
          </p>
          <p className="text-sm mt-1">
            {isFiltered
              ? "Try different search terms or clear the search."
              : "Check back soon — or be the first to publish one."}
          </p>
          {isFiltered ? (
            <button type="button" onClick={clearSearch} className="btn-secondary mt-5">
              Clear Search
            </button>
          ) : (
            <Link href={`/events/create?category=${categoryId}`} className="btn-primary mt-5 inline-flex">
              Create Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => gotoPage(page - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page === data.pagination.totalPages}
            onClick={() => gotoPage(page + 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}

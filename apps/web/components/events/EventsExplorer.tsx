"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, Filter, X, LayoutGrid, CalendarDays, MapPinned } from "lucide-react";
import { clsx } from "clsx";
import { useEvents } from "@/hooks/useEvents";
import { useCategories } from "@/hooks/useCategories";
import { EventCard } from "@/components/events/EventCard";
import { EventCalendar } from "@/components/events/EventCalendar";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import type { Category, EventSummary, PaginatedResponse } from "@/types";

const EventMap = dynamic(
  () => import("@/components/events/EventMap").then((m) => m.EventMap),
  {
    ssr: false,
    loading: () => <div className="skeleton h-[480px] sm:h-[560px] w-full rounded-2xl" />,
  }
);

interface Props {
  initialData?: PaginatedResponse<EventSummary>;
  categories: Category[];
}

export function EventsExplorer({ initialData, categories: categoryList }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "calendar" | "map">("list");

  const filters = {
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    page: view === "map" ? 1 : page,
    limit: view === "map" ? 100 : 12,
  };

  const { data, isLoading } = useEvents(filters, initialData);

  useCategories(categoryList);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    setPage(1);
    router.push(`/events?${params.toString()}`);
  }, [search, selectedCategory, router]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPage(1);
    router.push("/events");
  };

  const hasFilters = Boolean(search || selectedCategory);

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Events</h1>
          <p className="text-slate-500 text-sm">
            {data?.pagination.total
              ? `${data.pagination.total} events found`
              : "Discover religious and community events"}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            id="events-view-list"
            onClick={() => setView("list")}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "list"
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <LayoutGrid size={14} /> List
          </button>
          <button
            id="events-view-calendar"
            onClick={() => setView("calendar")}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "calendar"
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <CalendarDays size={14} /> Calendar
          </button>
          <button
            id="events-view-map"
            onClick={() => setView("map")}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              view === "map"
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <MapPinned size={14} /> Map
          </button>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 input px-4 py-3">
          <Search size={16} className="text-brand-600 shrink-0" />
          <input
            id="events-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search events…"
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(""); applyFilters(); }} className="text-slate-500 hover:text-slate-900 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          id="events-filter-button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`btn-secondary px-4 gap-2 ${filtersOpen ? "border-brand-500" : ""}`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-400" />}
        </button>

        <button id="events-search-apply" onClick={applyFilters} className="btn-primary px-5">
          Search
        </button>
      </div>

      {/* Expandable filters */}
      {filtersOpen && (
        <div className="card-glass p-5 mb-6 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div>
              <label className="label text-xs">Category</label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input text-xs py-2"
              >
                <option value="">All Categories</option>
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={applyFilters} className="btn-primary text-sm py-2">Apply Filters</button>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost text-sm text-slate-500">Clear All</button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {view === "calendar" ? (
        <EventCalendar
          search={searchParams.get("search") ?? undefined}
          category={searchParams.get("category") ?? undefined}
        />
      ) : view === "map" ? (
        isLoading ? (
          <div className="skeleton h-[480px] sm:h-[560px] w-full rounded-2xl" />
        ) : (
          <EventMap events={data?.data ?? []} />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => <EventCardSkeleton key={i} />)
              : data?.data.length === 0
                ? (
                    <div className="col-span-full text-center py-20 text-slate-500">
                      <p className="text-5xl mb-4">🔍</p>
                      <p className="text-lg font-medium">No events found</p>
                      <p className="text-sm mt-1">Try different search terms or clear your filters.</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="btn-secondary mt-4 text-sm">Clear Filters</button>
                      )}
                    </div>
                  )
                : data?.data.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                id="events-prev-page"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-slate-500 text-sm">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                id="events-next-page"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

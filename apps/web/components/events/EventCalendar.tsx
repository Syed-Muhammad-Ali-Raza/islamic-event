"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import type { EventSummary } from "@/types";

interface Props {
  search?: string;
  category?: string;
}

function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function EventCalendar({ search, category }: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const fromDate = toISODate(startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }));
  const toDate = toISODate(endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }));

  const { data, isLoading } = useEvents({
    fromDate,
    toDate,
    search: search || undefined,
    category: category || undefined,
    limit: 100,
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventSummary[]>();
    for (const event of data?.data ?? []) {
      const key = toISODate(new Date(event.date));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [data]);

  const monthEventCount = data?.pagination.total ?? data?.data.length ?? 0;

  return (
    <div className="card-glass p-4 sm:p-5" id="events-calendar">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            id="calendar-prev"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 min-w-[160px] text-center">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <button
            id="calendar-next"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            Today
          </button>
          <span className="text-slate-500 text-xs hidden sm:inline">
            {monthEventCount} event{monthEventCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = toISODate(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-[84px] sm:min-h-[100px] rounded-xl border p-1.5 transition-colors ${
                inMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
              } ${today ? "ring-2 ring-brand-600 border-brand-600" : ""}`}
            >
              <div
                className={`text-xs font-semibold mb-1 ${
                  today ? "text-brand-700" : inMonth ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {isLoading && inMonth ? (
                  <div className="skeleton h-3.5 w-full rounded" />
                ) : (
                  dayEvents.slice(0, 2).map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      title={event.title}
                      className="block truncate rounded-md bg-brand-50 border border-brand-100 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-brand-700 hover:bg-brand-100 hover:border-brand-200 transition-colors"
                    >
                      {event.startTime ? `${event.startTime} ` : ""}
                      {event.title}
                    </Link>
                  ))
                )}
                {!isLoading && dayEvents.length > 2 && (
                  <span className="block text-[10px] text-slate-400 pl-1.5">
                    +{dayEvents.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && monthEventCount === 0 && (
        <div className="text-center py-8 text-slate-500">
          <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No events this month</p>
        </div>
      )}
    </div>
  );
}

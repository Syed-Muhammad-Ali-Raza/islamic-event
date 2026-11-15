import { eachDayOfInterval } from "date-fns";

/**
 * Every day a (possibly multi-day) event is running inside [from, to].
 *
 * The calendar grid must show a 19–21 November expo on all three cells, but a
 * long-running event must never expand beyond the visible window; days of the
 * range outside [from, to] are clamped away. Single-day events (`endDate` null
 * or equal to `date`) yield exactly one day.
 */
export function eventDays(
  event: { date: string; endDate?: string | null },
  from: Date,
  to: Date
): Date[] {
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;
  const first = start < from ? from : start;
  const last = end > to ? to : end;
  if (first > last) return [];
  return eachDayOfInterval({ start: first, end: last });
}

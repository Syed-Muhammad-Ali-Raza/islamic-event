import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cityService } from "@/services/city.service";

export const cityKeys = {
  all: ["cities"] as const,
  list: ["cities", "list"] as const,
  /** One cache entry per normalised term, so re-typing a term costs 0 requests. */
  search: (q: string) => ["cities", "search", q.trim().toLowerCase()] as const,
};

export function useCities() {
  return useQuery({
    queryKey: cityKeys.list,
    queryFn: () => cityService.list(),
    staleTime: 300_000,
  });
}

/**
 * Server-side city lookup for the type-ahead picker.
 *
 * Pass an **already debounced** term: the hook does one request per pause, not
 * one per keystroke. `staleTime`/`gcTime` are deliberately long so a term that
 * was searched a moment ago is answered from cache (the API response is also
 * edge-cached for 60 s), which keeps the request count close to the number of
 * distinct terms a visitor actually types.
 */
export function useCitySearch(query: string) {
  const q = query.trim();

  return useQuery({
    queryKey: cityKeys.search(q),
    queryFn: () => cityService.search(q),
    enabled: q.length > 0,
    staleTime: 300_000,
    gcTime: 1_800_000,
    placeholderData: keepPreviousData,
  });
}

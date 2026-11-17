import type { CitySummary } from "@/types";

/** Comparison key: trimmed and lower-cased (the API is case-insensitive too). */
export function cityKey(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Rank `cities` against a typed term, dropping rows that do not match.
 *
 * Order: name prefix → name substring → state prefix → state substring. Ties
 * keep the incoming order, which is the API's "most approved events first", so
 * the busiest cities stay on top. An empty term returns the list untouched.
 *
 * The picker ranks whatever it already has (the cached city list) while the
 * debounced `?q=` request is in flight, so typing never waits on the network.
 */
export function rankCities(cities: CitySummary[], query: string): CitySummary[] {
  const q = cityKey(query);
  if (!q) return cities;

  const scored: { city: CitySummary; score: number }[] = [];
  for (const city of cities) {
    const name = cityKey(city.name);
    const state = cityKey(city.state);

    let score: number;
    if (name.startsWith(q)) score = 0;
    else if (name.includes(q)) score = 1;
    else if (state.startsWith(q)) score = 2;
    else if (state.includes(q)) score = 3;
    else continue;

    scored.push({ city, score });
  }

  return scored.sort((a, b) => a.score - b.score).map((entry) => entry.city);
}

/** Union two city lists by id, keeping the first list's order. */
export function mergeCities(primary: CitySummary[], extra: CitySummary[]): CitySummary[] {
  if (extra.length === 0) return primary;
  const seen = new Set(primary.map((city) => city.id));
  return [...primary, ...extra.filter((city) => !seen.has(city.id))];
}

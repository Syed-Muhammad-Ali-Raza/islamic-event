import { describe, expect, it } from "vitest";
import { cityKey, mergeCities, rankCities } from "./cities";
import type { CitySummary } from "@/types";

const city = (id: string, name: string, state: string, eventCount = 0): CitySummary => ({
  id,
  name,
  slug: id,
  state,
  eventCount,
});

const CITIES: CitySummary[] = [
  city("lahore", "Lahore", "Punjab", 40),
  city("karachi", "Karachi", "Sindh", 30),
  city("islamabad", "Islamabad", "Islamabad Capital Territory", 20),
  city("faisalabad", "Faisalabad", "Punjab", 10),
  city("rahim-yar-khan", "Rahim Yar Khan", "Punjab", 5),
];

describe("cityKey", () => {
  it("trims, lower-cases and tolerates nullish input", () => {
    expect(cityKey("  LaHoRe ")).toBe("lahore");
    expect(cityKey(undefined)).toBe("");
    expect(cityKey(null)).toBe("");
  });
});

describe("rankCities", () => {
  it("returns the list untouched for an empty term", () => {
    expect(rankCities(CITIES, "")).toEqual(CITIES);
    expect(rankCities(CITIES, "   ")).toEqual(CITIES);
  });

  it("drops non-matching cities and is case-insensitive", () => {
    const ranked = rankCities(CITIES, "LAH");
    expect(ranked.map((c) => c.id)).toEqual(["lahore"]);
  });

  it("puts name prefixes before name substrings", () => {
    const list = [city("ballah", "Ballah", "Punjab"), city("lahore", "Lahore", "Punjab")];
    expect(rankCities(list, "lah").map((c) => c.id)).toEqual(["lahore", "ballah"]);
  });

  it("falls back to the state name", () => {
    const ranked = rankCities(CITIES, "punjab");
    expect(ranked.map((c) => c.id)).toEqual(["lahore", "faisalabad", "rahim-yar-khan"]);
  });

  it("keeps the incoming (most events first) order for equal scores", () => {
    const list = [city("big", "Big City", "X", 99), city("small", "Small City", "Y", 1)];
    expect(rankCities(list, "city").map((c) => c.id)).toEqual(["big", "small"]);
  });

  it("returns nothing when no city matches", () => {
    expect(rankCities(CITIES, "zzzz")).toEqual([]);
  });
});

describe("mergeCities", () => {
  it("appends only cities the primary list does not already hold", () => {
    const extra = [city("lahore", "Lahore", "Punjab", 40), city("multan", "Multan", "Punjab", 3)];
    const merged = mergeCities(CITIES, extra);
    expect(merged).toHaveLength(CITIES.length + 1);
    expect(merged.map((c) => c.id)).toContain("multan");
    expect(merged.filter((c) => c.id === "lahore")).toHaveLength(1);
  });

  it("returns the primary list when there is nothing to add", () => {
    expect(mergeCities(CITIES, [])).toBe(CITIES);
  });
});

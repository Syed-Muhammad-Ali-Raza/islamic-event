import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, eventJsonLd, itemListJsonLd } from "./seo";

const base = {
  title: "IDEAS 2026",
  description: "Pakistan's defence exhibition",
  date: "2026-11-24T00:00:00.000Z",
  venue: "Karachi Expo Centre",
  address: "University Road, Gulshan-e-Iqbal",
  city: "Karachi",
  latitude: 24.9165,
  longitude: 67.0975,
  path: "/events/ideas-2026",
  organizer: { name: "Pakistan Expo & Trade Show Desk" },
};

describe("eventJsonLd", () => {
  it("reduces an API ISO timestamp to a valid startDate", () => {
    const ld = eventJsonLd({ ...base, startTime: "09:00", endTime: "18:00" });
    // Regression: the API date is a full timestamp, so `${date}T09:00` used to
    // produce "2026-11-24T00:00:00.000ZT09:00:00" (invalid, no rich result).
    expect(ld.startDate).toBe("2026-11-24T09:00:00+05:00");
    expect(ld.endDate).toBe("2026-11-24T18:00:00+05:00");
    expect(String(ld.startDate)).not.toContain("ZT");
  });

  it("falls back to a date-only startDate when no start time is set", () => {
    const ld = eventJsonLd({ ...base, startTime: null });
    expect(ld.startDate).toBe("2026-11-24");
    expect(ld.endDate).toBeUndefined();
  });

  it("emits a citable Place with postal address and geo coordinates", () => {
    const ld = eventJsonLd(base) as unknown as {
      location: {
        name: string;
        address: Record<string, string>;
        geo: { latitude: number; longitude: number };
      };
    };
    expect(ld.location.name).toBe("Karachi Expo Centre");
    expect(ld.location.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "University Road, Gulshan-e-Iqbal",
      addressLocality: "Karachi",
      addressCountry: "PK",
    });
    expect(ld.location.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 24.9165,
      longitude: 67.0975,
    });
  });

  it("omits geo when coordinates are missing", () => {
    const ld = eventJsonLd({ ...base, latitude: null, longitude: null }) as unknown as {
      location: Record<string, unknown>;
    };
    expect(ld.location.geo).toBeUndefined();
  });

  it("publishes an absolute event url and the organizer", () => {
    const ld = eventJsonLd(base) as unknown as { url: string; organizer: Record<string, string> };
    expect(ld.url).toMatch(/\/events\/ideas-2026$/);
    expect(ld.organizer).toEqual({
      "@type": "Organization",
      name: "Pakistan Expo & Trade Show Desk",
    });
  });

  it("omits location when the event has no place data at all", () => {
    const ld = eventJsonLd({ title: "Online Dars", date: "2026-12-01" });
    expect(ld.location).toBeUndefined();
    expect(ld.startDate).toBe("2026-12-01");
  });
});

describe("breadcrumbJsonLd / itemListJsonLd", () => {
  it("numbers breadcrumb items and absolutises paths", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Events", path: "/events" },
    ]) as unknown as { itemListElement: { position: number; item: string }[] };
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toMatch(/\/events$/);
  });

  it("keeps absolute entry urls untouched", () => {
    const ld = itemListJsonLd("Upcoming", [
      { name: "A", path: "/events/a" },
      { name: "B", path: "https://example.com/b" },
    ]) as unknown as { numberOfItems: number; itemListElement: { url: string }[] };
    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement[1].url).toBe("https://example.com/b");
  });
});

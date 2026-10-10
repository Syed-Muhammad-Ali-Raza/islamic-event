import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeProcession(
  overrides: Partial<{
    city: string;
    month: string;
    day: string;
    kind: string;
    name: string;
    type: string;
    start: string;
    end: string;
    route: string;
    routeHighlights: string;
    time: string;
    googleMaps: string;
    description: string;
    notes: string;
    sortOrder: number;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("PROC");
  return prisma.procession.create({
    data: {
      sourceId,
      city: overrides.city ?? "Lahore",
      month: overrides.month ?? "Muharram",
      day: overrides.day ?? "10",
      kind: overrides.kind ?? "procession",
      name: overrides.name ?? `Procession ${sourceId}`,
      type: overrides.type ?? null,
      start: overrides.start ?? null,
      end: overrides.end ?? null,
      route: overrides.route ?? null,
      routeHighlights: overrides.routeHighlights ?? null,
      time: overrides.time ?? null,
      googleMaps: overrides.googleMaps ?? null,
      description: overrides.description ?? null,
      notes: overrides.notes ?? null,
      sortOrder: overrides.sortOrder ?? 0,
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Muharram processions directory", () => {
  it("is public and returns only active entries", async () => {
    await makeProcession({ name: "Active Jaloos" });
    await makeProcession({ name: "Retired Jaloos", isActive: false });

    const res = await api().get("/api/v1/processions");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Jaloos");
  });

  it("filters by city case-insensitively", async () => {
    const city = unique("ProcCity");
    await makeProcession({ city });
    await makeProcession({ city: "Karachi" });

    const res = await api().get(`/api/v1/processions?city=${city.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe(city);
  });

  it("filters by month and day", async () => {
    const city = unique("MonthCity");
    await makeProcession({ city, month: "Muharram", day: "10", name: "Ashura" });
    await makeProcession({ city, month: "Safar", day: "20", name: "Chehlum" });

    const m = await api().get(`/api/v1/processions?city=${city}&month=Muharram`);
    expect(m.body.pagination.total).toBe(1);
    expect(m.body.data[0].name).toBe("Ashura");

    const d = await api().get(`/api/v1/processions?city=${city}&month=Safar&day=20`);
    expect(d.body.pagination.total).toBe(1);
    expect(d.body.data[0].name).toBe("Chehlum");
  });

  it("filters by kind (procession, road_closure, summary)", async () => {
    const city = unique("KindCity");
    await makeProcession({ city, kind: "procession", name: "Jaloos" });
    await makeProcession({ city, kind: "road_closure", name: "Closed Roads" });
    await makeProcession({ city, kind: "summary", name: "Overview" });

    const closures = await api().get(`/api/v1/processions?city=${city}&kind=road_closure`);
    expect(closures.body.pagination.total).toBe(1);
    expect(closures.body.data[0].name).toBe("Closed Roads");

    const summaries = await api().get(`/api/v1/processions?city=${city}&kind=summary`);
    expect(summaries.body.pagination.total).toBe(1);
    expect(summaries.body.data[0].name).toBe("Overview");
  });

  it("orders by city then sortOrder", async () => {
    const prefix = unique("Ord");
    await makeProcession({ city: `${prefix} B`, sortOrder: 1, name: "B1" });
    await makeProcession({ city: `${prefix} A`, sortOrder: 2, name: "A2" });
    await makeProcession({ city: `${prefix} A`, sortOrder: 1, name: "A1" });

    const res = await api().get(`/api/v1/processions?city=${prefix}%20A`);
    expect(res.body.data[0].name).toBe("A1");
    expect(res.body.data[1].name).toBe("A2");
  });

  it("searches across name, city, type and start", async () => {
    await makeProcession({
      name: "Central Zuljanah",
      start: "Nisar Haveli",
      description: "desc",
    });
    await makeProcession({ name: "Other", start: "Elsewhere" });

    const res = await api().get("/api/v1/processions?q=Zuljanah");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Central Zuljanah");

    const res2 = await api().get("/api/v1/processions?q=Nisar%20Haveli");
    expect(res2.body.pagination.total).toBe(1);
  });

  it("returns a single entry by sourceId and 404s otherwise", async () => {
    const p = await makeProcession({ name: "Single Jaloos", route: "Nisar Haveli → Gamay Shah" });

    const ok = await api().get(`/api/v1/processions/${p.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Jaloos");
    expect(ok.body.data.route).toBe("Nisar Haveli → Gamay Shah");

    const missing = await api().get("/api/v1/processions/nothing");
    expect(missing.status).toBe(404);

    await prisma.procession.update({ where: { id: p.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/processions/${p.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("rejects an invalid kind value with 422", async () => {
    const res = await api().get("/api/v1/processions?kind=parade");
    expect(res.status).toBe(422);
  });
});

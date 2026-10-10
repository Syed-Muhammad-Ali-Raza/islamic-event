import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makePoint(
  overrides: Partial<{
    name: string;
    city: string;
    address: string;
    type: string;
    area: string;
    isActive: boolean;
    verified: boolean;
    schedule: string;
  }> = {}
) {
  const sourceId = unique("DSH");
  return prisma.dastarkhwan.create({
    data: {
      sourceId,
      name: overrides.name ?? `Dastarkhwan ${sourceId}`,
      city: overrides.city ?? "Lahore",
      area: overrides.area ?? "Mozang",
      address: overrides.address ?? "Safanwala Chowk, Lahore",
      type: overrides.type ?? "Free langar",
      schedule: overrides.schedule ?? "Daily",
      isActive: overrides.isActive ?? true,
      verified: overrides.verified ?? false,
    },
  });
}

describe("Free Dastarkhwan directory", () => {
  it("is public and returns only active points", async () => {
    await makePoint({ name: "Active Point" });
    await makePoint({ name: "Retired Point", isActive: false });

    const res = await api().get("/api/v1/dastarkhwans");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Point");
    expect(res.body.data[0].sourceUrl).toBeNull();
  });

  it("filters by city case-insensitively", async () => {
    await makePoint({ city: "Karachi" });
    await makePoint({ city: "Multan" });

    const res = await api().get("/api/v1/dastarkhwans?city=karachi");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe("Karachi");
  });

  it("searches across name, area and address", async () => {
    await makePoint({ name: "Bahria Dastarkhwan" });
    await makePoint({ name: "Other", address: "Numaish Chorangi, Karachi" });

    const res = await api().get("/api/v1/dastarkhwans?q=Numaish");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Other");

    const res2 = await api().get("/api/v1/dastarkhwans?q=bahria");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Bahria Dastarkhwan");
  });

  it("returns a single point by sourceId and 404s otherwise", async () => {
    const point = await makePoint({ name: "Single Point" });

    const ok = await api().get(`/api/v1/dastarkhwans/${point.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Point");
    expect(ok.body.data.googleMapsUrl).toBeNull();

    const missing = await api().get("/api/v1/dastarkhwans/LHR-999");
    expect(missing.status).toBe(404);

    await prisma.dastarkhwan.update({ where: { id: point.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/dastarkhwans/${point.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("rejects an over-long search term with 422", async () => {
    const res = await api().get(`/api/v1/dastarkhwans?q=${"a".repeat(150)}`);
    expect(res.status).toBe(422);
  });

  it("paginates", async () => {
    const city = unique("PagCity");
    for (let i = 0; i < 5; i++) await makePoint({ name: `Page Point ${i}`, city });

    const res = await api().get(`/api/v1/dastarkhwans?city=${city}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });
});

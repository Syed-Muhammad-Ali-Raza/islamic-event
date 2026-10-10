import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makePlace(
  overrides: Partial<{
    name: string;
    category: string;
    type: string;
    city: string;
    province: string;
    address: string;
    description: string;
    builtYear: string;
    unescoStatus: string;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("PLC");
  return prisma.place.create({
    data: {
      sourceId,
      name: overrides.name ?? `Place ${sourceId}`,
      category: overrides.category ?? "Historical",
      type: overrides.type ?? "Fort",
      city: overrides.city ?? "Lahore",
      province: overrides.province ?? "Punjab",
      address: overrides.address ?? "Walled City, Lahore",
      description: overrides.description ?? null,
      builtYear: overrides.builtYear ?? null,
      unescoStatus: overrides.unescoStatus ?? "Not inscribed",
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Pakistan places directory", () => {
  it("is public and returns only active places", async () => {
    await makePlace({ name: "Active Place" });
    await makePlace({ name: "Retired Place", isActive: false });

    const res = await api().get("/api/v1/places");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Place");
    expect(res.body.data[0].category).toBe("Historical");
    expect(res.body.data[0].mapLink).toBeNull();
  });

  it("filters by category case-insensitively", async () => {
    await makePlace({ name: "A Mosque", category: "Religious", type: "Mosque" });
    await makePlace({ name: "A Lake", category: "Natural / Tourist", type: "Lake" });

    const res = await api().get("/api/v1/places?category=religious");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("A Mosque");

    const res2 = await api().get(`/api/v1/places?category=${encodeURIComponent("Natural / Tourist")}`);
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("A Lake");
  });

  it("filters by province case-insensitively", async () => {
    await makePlace({ province: "Sindh" });
    await makePlace({ province: "Balochistan" });

    const res = await api().get("/api/v1/places?province=sindh");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].province).toBe("Sindh");
  });

  it("searches across name, type, city and description", async () => {
    await makePlace({ name: "Khyber Citadel", description: "Ancient mountain pass fort" });
    await makePlace({ name: "Other", type: "Lake", description: "Turquoise lake formed by a landslide" });

    const res = await api().get("/api/v1/places?q=landslide");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Other");

    const res2 = await api().get("/api/v1/places?q=citadel");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Khyber Citadel");
  });

  it("returns a single place by sourceId and 404s otherwise", async () => {
    const place = await makePlace({ name: "Single Place", builtYear: "1541-1548" });

    const ok = await api().get(`/api/v1/places/${place.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Place");
    expect(ok.body.data.builtYear).toBe("1541-1548");

    const missing = await api().get("/api/v1/places/nowhere");
    expect(missing.status).toBe(404);

    await prisma.place.update({ where: { id: place.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/places/${place.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("paginates", async () => {
    const city = unique("PagCity");
    for (let i = 0; i < 5; i++) await makePlace({ name: `Page Place ${i}`, city });

    const res = await api().get(`/api/v1/places?city=${city}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });
});

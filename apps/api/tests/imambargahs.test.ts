import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makePoint(
  overrides: Partial<{
    name: string;
    city: string;
    address: string;
    area: string;
    isActive: boolean;
    verified: boolean;
    yearBuilt: string;
    founderOrCaretaker: string;
    confidence: string;
  }> = {}
) {
  const sourceId = unique("IB");
  return prisma.imambargah.create({
    data: {
      sourceId,
      name: overrides.name ?? `Imambargah ${sourceId}`,
      city: overrides.city ?? "Lahore",
      area: overrides.area ?? "Mochi Gate",
      address: overrides.address ?? "Walled City, Lahore",
      yearBuilt: overrides.yearBuilt ?? null,
      founderOrCaretaker: overrides.founderOrCaretaker ?? null,
      isActive: overrides.isActive ?? true,
      verified: overrides.verified ?? false,
      confidence: overrides.confidence ?? "news/heritage source",
    },
  });
}

describe("Imambargah directory", () => {
  it("is public and returns only active points", async () => {
    await makePoint({ name: "Active Imam" });
    await makePoint({ name: "Retired Imam", isActive: false });

    const res = await api().get("/api/v1/imambargahs");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Imam");
    expect(res.body.data[0].confidence).toBe("news/heritage source");
    expect(res.body.data[0].sourceUrl).toBeNull();
  });

  it("filters by city case-insensitively", async () => {
    await makePoint({ city: "Quetta" });
    await makePoint({ city: "Peshawar" });

    const res = await api().get("/api/v1/imambargahs?city=quetta");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe("Quetta");
  });

  it("searches across name, area, address and founder", async () => {
    await makePoint({ name: "Imambargah Kalan" });
    await makePoint({ name: "Other", address: "McConaghey Road, Quetta" });
    await makePoint({ founderOrCaretaker: "Colonel Maqbool Hussain" });

    const res = await api().get("/api/v1/imambargahs?q=McConaghey");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Other");

    const res2 = await api().get("/api/v1/imambargahs?q=kalan");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Imambargah Kalan");

    const res3 = await api().get("/api/v1/imambargahs?q=Maqbool");
    expect(res3.body.pagination.total).toBe(1);
    expect(res3.body.data[0].founderOrCaretaker).toBe("Colonel Maqbool Hussain");
  });

  it("returns a single point by sourceId and 404s otherwise", async () => {
    const point = await makePoint({ name: "Single Imam", yearBuilt: "1877 (per some sources)" });

    const ok = await api().get(`/api/v1/imambargahs/${point.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Imam");
    expect(ok.body.data.yearBuilt).toBe("1877 (per some sources)");
    expect(ok.body.data.googleMapsUrl).toBeNull();

    const missing = await api().get("/api/v1/imambargahs/LHR-IB-999");
    expect(missing.status).toBe(404);

    await prisma.imambargah.update({ where: { id: point.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/imambargahs/${point.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("rejects an over-long search term with 422", async () => {
    const res = await api().get(`/api/v1/imambargahs?q=${"a".repeat(150)}`);
    expect(res.status).toBe(422);
  });

  it("paginates", async () => {
    const city = unique("PagCity");
    for (let i = 0; i < 5; i++) await makePoint({ name: `Page Point ${i}`, city });

    const res = await api().get(`/api/v1/imambargahs?city=${city}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });
});

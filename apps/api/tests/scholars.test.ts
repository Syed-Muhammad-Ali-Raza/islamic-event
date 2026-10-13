import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeScholar(
  overrides: Partial<{
    name: string;
    nameUrdu: string | null;
    honorific: string | null;
    sect: string;
    category: string;
    status: string;
    birthDate: string | null;
    deathDate: string | null;
    city: string | null;
    country: string | null;
    bio: string | null;
    education: string | null;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("SCH");
  return prisma.scholar.create({
    data: {
      sourceId,
      slug: `scholar-${sourceId.toLowerCase()}`,
      name: overrides.name ?? `Scholar ${sourceId}`,
      nameUrdu: overrides.nameUrdu ?? null,
      honorific: overrides.honorific ?? null,
      sect: overrides.sect ?? "SUNNI",
      category: overrides.category ?? "SCHOLAR",
      status: overrides.status ?? "DECEASED",
      birthDate: overrides.birthDate ?? null,
      deathDate: overrides.deathDate ?? null,
      city: overrides.city ?? "Lahore",
      country: overrides.country ?? "Pakistan",
      bio: overrides.bio ?? null,
      education: overrides.education ?? null,
      works: [],
      sources: [],
      confidence: "UNVERIFIED",
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Scholars directory", () => {
  it("is public and returns only active scholars", async () => {
    await makeScholar({ name: "Active Scholar", sect: "SHIA", deathDate: "c. 1800" });
    await makeScholar({ name: "Retired Scholar", isActive: false });

    const res = await api().get("/api/v1/scholars");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Scholar");
    expect(res.body.data[0].sect).toBe("SHIA");
    expect(res.body.data[0].deathDate).toBe("c. 1800");
  });

  it("filters by sect", async () => {
    const city = unique("SectCity");
    await makeScholar({ name: "Sunni Scholar", sect: "SUNNI", city });
    await makeScholar({ name: "Shia Scholar", sect: "SHIA", city });

    const res = await api().get(`/api/v1/scholars?sect=SHIA&city=${city}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Shia Scholar");

    const res2 = await api().get(`/api/v1/scholars?sect=SUNNI&city=${city}`);
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Sunni Scholar");
  });

  it("filters by category", async () => {
    const city = unique("CatCity");
    await makeScholar({ name: "Marja", category: "MARJA", sect: "SHIA", city });
    await makeScholar({ name: "Regular", category: "SCHOLAR", city });

    const res = await api().get(`/api/v1/scholars?category=MARJA&city=${city}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Marja");
  });

  it("filters by city case-insensitively", async () => {
    await makeScholar({ name: "Multan Scholar", city: "Multan" });
    await makeScholar({ name: "Kasur Scholar", city: "Kasur" });

    const res = await api().get("/api/v1/scholars?city=multan");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe("Multan");
  });

  it("searches across name, honorific, city and bio", async () => {
    const city = unique("SearchCity");
    await makeScholar({ name: "Imam Khomeini", honorific: "Imam", sect: "SHIA", city });
    await makeScholar({ name: "Other", bio: "Known for hanafi fiqh rulings", city });

    const res = await api().get(`/api/v1/scholars?q=hanafi&city=${city}`);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Other");

    const res2 = await api().get(`/api/v1/scholars?q=Khomeini&city=${city}`);
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Imam Khomeini");
  });

  it("returns a single scholar by sourceId and 404s otherwise", async () => {
    const scholar = await makeScholar({ name: "Single Scholar", deathDate: "d. 2020" });

    const ok = await api().get(`/api/v1/scholars/${scholar.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Scholar");
    expect(ok.body.data.deathDate).toBe("d. 2020");
    expect(ok.body.data.slug).toMatch(/^scholar-sch-/);

    const missing = await api().get("/api/v1/scholars/nothing");
    expect(missing.status).toBe(404);

    await prisma.scholar.update({ where: { id: scholar.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/scholars/${scholar.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("paginates", async () => {
    const city = unique("PagCity");
    for (let i = 0; i < 5; i++) await makeScholar({ name: `Page Scholar ${i}`, city });

    const res = await api().get(`/api/v1/scholars?city=${city}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });

  it("rejects invalid sect with 422", async () => {
    const res = await api().get("/api/v1/scholars?sect=BAHA'I");
    expect(res.status).toBe(422);
  });
});

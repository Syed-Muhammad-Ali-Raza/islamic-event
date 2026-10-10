import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeDarbar(
  overrides: Partial<{
    name: string;
    saint: string;
    saintDeathYear: string;
    ursDate: string;
    city: string;
    province: string;
    address: string;
    description: string;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("DBR");
  return prisma.darbar.create({
    data: {
      sourceId,
      name: overrides.name ?? `Darbar ${sourceId}`,
      saint: overrides.saint ?? "Some Saint",
      saintDeathYear: overrides.saintDeathYear ?? null,
      ursDate: overrides.ursDate ?? null,
      city: overrides.city ?? "Lahore",
      province: overrides.province ?? "Punjab",
      address: overrides.address ?? "Bhati Gate, Lahore",
      description: overrides.description ?? null,
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Darbars directory", () => {
  it("is public and returns only active darbars", async () => {
    await makeDarbar({ name: "Active Darbar" });
    await makeDarbar({ name: "Retired Darbar", isActive: false });

    const res = await api().get("/api/v1/darbars");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Darbar");
    expect(res.body.data[0].saint).toBe("Some Saint");
    expect(res.body.data[0].mapLink).toBeNull();
  });

  it("filters by province case-insensitively", async () => {
    await makeDarbar({ province: "Sindh" });
    await makeDarbar({ province: "Balochistan" });

    const res = await api().get("/api/v1/darbars?province=sindh");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].province).toBe("Sindh");
  });

  it("filters by city case-insensitively", async () => {
    await makeDarbar({ city: "Multan" });
    await makeDarbar({ city: "Kasur" });

    const res = await api().get("/api/v1/darbars?city=multan");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe("Multan");
  });

  it("searches across name, saint, city and description", async () => {
    await makeDarbar({ name: "Data Darbar", saint: "Ali Hujwiri" });
    await makeDarbar({ name: "Other", description: "Famous for dhamal gatherings" });

    const res = await api().get("/api/v1/darbars?q=dhamal");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Other");

    const res2 = await api().get("/api/v1/darbars?q=Hujwiri");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Data Darbar");
  });

  it("returns a single darbar by sourceId and 404s otherwise", async () => {
    const darbar = await makeDarbar({ name: "Single Darbar", ursDate: "18-20 Safar" });

    const ok = await api().get(`/api/v1/darbars/${darbar.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Darbar");
    expect(ok.body.data.ursDate).toBe("18-20 Safar");

    const missing = await api().get("/api/v1/darbars/nothing");
    expect(missing.status).toBe(404);

    await prisma.darbar.update({ where: { id: darbar.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/darbars/${darbar.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("paginates", async () => {
    const city = unique("PagCity");
    for (let i = 0; i < 5; i++) await makeDarbar({ name: `Page Darbar ${i}`, city });

    const res = await api().get(`/api/v1/darbars?city=${city}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });
});

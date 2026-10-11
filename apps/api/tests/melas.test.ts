import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeMela(
  overrides: Partial<{
    name: string;
    type: string;
    city: string;
    province: string;
    venue: string;
    whenHeld: string;
    whatHappens: string;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("MELA");
  return prisma.mela.create({
    data: {
      sourceId,
      name: overrides.name ?? `Mela ${sourceId}`,
      type: overrides.type ?? "Cultural festival",
      city: overrides.city ?? "Lahore",
      province: overrides.province ?? "Punjab",
      venue: overrides.venue ?? "Baghbanpura",
      whenHeld: overrides.whenHeld ?? "March",
      whatHappens: overrides.whatHappens ?? "Qawwali and food stalls",
      isActive: overrides.isActive ?? true,
    },
  });
}

async function makeAuqaf(
  overrides: Partial<{ name: string; zone: string; dateAsPublished: string; isActive: boolean }> = {}
) {
  const sourceId = unique("AUQAF");
  return prisma.auqafUrsDate.create({
    data: {
      sourceId,
      name: overrides.name ?? `Shrine ${sourceId}`,
      type: "Urs / shrine event (Punjab Auqaf calendar)",
      zone: overrides.zone ?? "Lahore Zone",
      province: "Punjab",
      dateAsPublished: overrides.dateAsPublished ?? "18 - 20 Safar-ul-Muzaffar",
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Melas directory", () => {
  it("is public and returns only active melas", async () => {
    await makeMela({ name: "Active Mela" });
    await makeMela({ name: "Retired Mela", isActive: false });

    const res = await api().get("/api/v1/melas");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Mela");
    expect(res.body.data[0].city).toBe("Lahore");
    expect(res.body.data[0].latitude).toBeNull();
  });

  it("filters by city case-insensitively (contains, for multi-city rows)", async () => {
    const town = unique("Town");
    await makeMela({ city: `${town}, Eminabad` });
    await makeMela({ city: unique("Elsewhere") });

    const res = await api().get(`/api/v1/melas?city=${town.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe(`${town}, Eminabad`);
  });

  it("filters by province case-insensitively", async () => {
    await makeMela({ province: "Sindh" });
    await makeMela({ province: "Punjab" });

    const res = await api().get("/api/v1/melas?province=sindh");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].province).toBe("Sindh");
  });

  it("searches across name, type, city, venue and what-happens", async () => {
    await makeMela({ name: "Mela Chiraghan" });
    await makeMela({ name: "Shandur Polo Festival", whatHappens: "Polo matches at high altitude" });

    const res = await api().get("/api/v1/melas?q=polo");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Shandur Polo Festival");

    const res2 = await api().get("/api/v1/melas?q=Chiraghan");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Mela Chiraghan");
  });

  it("returns a single mela by sourceId and 404s otherwise", async () => {
    const mela = await makeMela({ name: "Single Mela", whenHeld: "Last week of March" });

    const ok = await api().get(`/api/v1/melas/${mela.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Mela");
    expect(ok.body.data.whenHeld).toBe("Last week of March");

    const missing = await api().get("/api/v1/melas/nothing");
    expect(missing.status).toBe(404);

    await prisma.mela.update({ where: { id: mela.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/melas/${mela.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("paginates", async () => {
    const city = unique("PagCity");
    for (let i = 0; i < 5; i++) await makeMela({ name: `Page Mela ${i}`, city });

    const res = await api().get(`/api/v1/melas?city=${city}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });
});

describe("Auqaf urs calendar", () => {
  it("is public and returns only active dates", async () => {
    await makeAuqaf({ name: "Active Urs" });
    await makeAuqaf({ name: "Retired Urs", isActive: false });

    const res = await api().get("/api/v1/auqaf-urs-dates");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Urs");
    expect(res.body.data[0].zone).toBe("Lahore Zone");
  });

  it("filters by zone case-insensitively", async () => {
    await makeAuqaf({ zone: "Multan Zone" });
    await makeAuqaf({ zone: "Lahore Zone" });

    const res = await api().get("/api/v1/auqaf-urs-dates?zone=multan%20zone");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].zone).toBe("Multan Zone");
  });

  it("searches across name, zone and published date", async () => {
    await makeAuqaf({ name: "Hazrat Data Gunj Bukhsh (RA)" });
    await makeAuqaf({ name: "Other Shrine", dateAsPublished: "24 Rabi-ul-Awwal" });

    const res = await api().get("/api/v1/auqaf-urs-dates?q=Data%20Gunj");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Hazrat Data Gunj Bukhsh (RA)");

    const res2 = await api().get("/api/v1/auqaf-urs-dates?q=rabi-ul-awwal");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].dateAsPublished).toBe("24 Rabi-ul-Awwal");
  });

  it("paginates", async () => {
    const zone = unique("PagZone");
    for (let i = 0; i < 5; i++) await makeAuqaf({ name: `Page Urs ${i}`, zone });

    const res = await api().get(`/api/v1/auqaf-urs-dates?zone=${zone}&page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });
});

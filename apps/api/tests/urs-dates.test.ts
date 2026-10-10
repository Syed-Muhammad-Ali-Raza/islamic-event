import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeUrsDate(
  overrides: Partial<{
    name: string;
    saint: string;
    city: string;
    ursRule: string;
    lastObserved: string;
    nextExpected: string;
    confidence: string;
    sources: string;
    notes: string;
    howToConfirm: string;
    researched: boolean;
    upcomingOrder: number;
    isActive: boolean;
  }> = {}
) {
  const sourceId = unique("URS");
  return prisma.ursDate.create({
    data: {
      sourceId,
      name: overrides.name ?? `Urs ${sourceId}`,
      saint: overrides.saint ?? "Some Saint",
      city: overrides.city ?? "Lahore",
      ursRule: overrides.ursRule ?? null,
      lastObserved: overrides.lastObserved ?? null,
      nextExpected: overrides.nextExpected ?? null,
      confidence: overrides.confidence ?? "medium",
      sources: overrides.sources ?? null,
      notes: overrides.notes ?? null,
      howToConfirm: overrides.howToConfirm ?? null,
      researched: overrides.researched ?? true,
      upcomingOrder: overrides.upcomingOrder ?? null,
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("Urs dates directory", () => {
  it("is public and returns only active entries", async () => {
    await makeUrsDate({ name: "Active Urs" });
    await makeUrsDate({ name: "Retired Urs", isActive: false });

    const res = await api().get("/api/v1/urs-dates");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Active Urs");
    expect(res.body.data[0].confidence).toBe("medium");
    expect(res.body.data[0].mapLink).toBeUndefined();
  });

  it("filters by researched flag", async () => {
    const city = unique("ResCity");
    await makeUrsDate({ name: "Researched", city, researched: true, nextExpected: "About Oct 2026" });
    await makeUrsDate({ name: "Unresearched", city, researched: false, confidence: "none", howToConfirm: "Ask Auqaf" });

    const yes = await api().get(`/api/v1/urs-dates?researched=true&city=${city}`);
    expect(yes.body.pagination.total).toBe(1);
    expect(yes.body.data[0].name).toBe("Researched");

    const no = await api().get(`/api/v1/urs-dates?researched=false&city=${city}`);
    expect(no.body.pagination.total).toBe(1);
    expect(no.body.data[0].howToConfirm).toBe("Ask Auqaf");
  });

  it("filters by city case-insensitively", async () => {
    await makeUrsDate({ city: "Multan" });
    await makeUrsDate({ city: "Kasur" });

    const res = await api().get("/api/v1/urs-dates?city=multan");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].city).toBe("Multan");
  });

  it("orders upcoming entries by upcomingOrder first", async () => {
    const city = unique("OrdCity");
    await makeUrsDate({ name: "Second", city, upcomingOrder: 2 });
    await makeUrsDate({ name: "First", city, upcomingOrder: 1 });
    await makeUrsDate({ name: "No order", city });

    const res = await api().get(`/api/v1/urs-dates?city=${city}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("First");
    expect(res.body.data[1].name).toBe("Second");
    expect(res.body.data[2].name).toBe("No order");
  });

  it("searches across name, saint, city and nextExpected", async () => {
    await makeUrsDate({ name: "Data Darbar", saint: "Ali Hujwiri", nextExpected: "About Jul 2027" });
    await makeUrsDate({ name: "Other", nextExpected: "About Jan 2027" });

    const res = await api().get("/api/v1/urs-dates?q=Hujwiri");
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.data[0].name).toBe("Data Darbar");

    const res2 = await api().get("/api/v1/urs-dates?q=Jan 2027");
    expect(res2.body.pagination.total).toBe(1);
    expect(res2.body.data[0].name).toBe("Other");
  });

  it("returns a single entry by sourceId and 404s otherwise", async () => {
    const entry = await makeUrsDate({ name: "Single Urs", ursRule: "18-20 Safar" });

    const ok = await api().get(`/api/v1/urs-dates/${entry.sourceId}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe("Single Urs");
    expect(ok.body.data.ursRule).toBe("18-20 Safar");

    const missing = await api().get("/api/v1/urs-dates/nothing");
    expect(missing.status).toBe(404);

    await prisma.ursDate.update({ where: { id: entry.id }, data: { isActive: false } });
    const inactive = await api().get(`/api/v1/urs-dates/${entry.sourceId}`);
    expect(inactive.status).toBe(404);
  });

  it("rejects an invalid researched value with 422", async () => {
    const res = await api().get("/api/v1/urs-dates?researched=maybe");
    expect(res.status).toBe(422);
  });
});

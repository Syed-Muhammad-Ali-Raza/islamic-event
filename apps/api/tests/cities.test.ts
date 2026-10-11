import { api, unique, registerUser, createCategory, createEventAs } from "./helpers";
import { prisma } from "../src/config/prisma";

async function makeCity(prefix = "City") {
  const code = `${Date.now().toString(36).slice(-3)}`.toUpperCase();
  const country = await prisma.country.create({
    data: { name: unique("Ctry"), code },
  });
  const state = await prisma.state.create({
    data: { name: unique("State"), countryId: country.id },
  });
  return prisma.city.create({
    data: { name: `${prefix} ${unique("ct")}`, slug: unique("city"), stateId: state.id },
  });
}

async function makeApprovedEvent(cityId: string, categoryId: string, userId: string, title: string) {
  const event = await createEventAs(userId, categoryId, { title });
  await prisma.event.update({
    where: { id: event.id },
    data: { status: "APPROVED", cityId },
  });
  return event;
}

describe("City directory", () => {
  it("lists active cities with approved event counts, sorted by count desc", async () => {
    const user = await registerUser("city");
    const category = await createCategory("CityCat");

    const withEvents = await makeCity("WithEvents");
    const noEvents = await makeCity("NoEvents");

    await makeApprovedEvent(withEvents.id, category.id, user.id, `City Event A ${unique("t")}`);
    await makeApprovedEvent(withEvents.id, category.id, user.id, `City Event B ${unique("t")}`);

    const res = await api().get("/api/v1/cities");
    expect(res.status).toBe(200);

    const slugs = res.body.data.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain(withEvents.slug);
    expect(slugs).toContain(noEvents.slug);

    const entry = res.body.data.find((c: { slug: string }) => c.slug === withEvents.slug);
    expect(entry.eventCount).toBeGreaterThanOrEqual(2);
    expect(entry.name).toBeTruthy();
    expect(entry.state).toBeTruthy();

    const empty = res.body.data.find((c: { slug: string }) => c.slug === noEvents.slug);
    expect(empty.eventCount).toBe(0);

    const counts = res.body.data.map((c: { eventCount: number }) => c.eventCount);
    const sorted = [...counts].sort((a, b) => b - a);
    expect(counts).toEqual(sorted);
  });

  it("does not count pending (unapproved) events", async () => {
    const user = await registerUser("city2");
    const category = await createCategory("CityCat2");
    const city = await makeCity("PendingCity");

    const event = await createEventAs(user.id, category.id, { title: `Pending ${unique("t")}` });
    await prisma.event.update({
      where: { id: event.id },
      data: { status: "PENDING_REVIEW", cityId: city.id },
    });

    const res = await api().get("/api/v1/cities");
    expect(res.status).toBe(200);
    const entry = res.body.data.find((c: { slug: string }) => c.slug === city.slug);
    expect(entry).toBeDefined();
    expect(entry.eventCount).toBe(0);
  });

  it("returns a single city with event count by slug", async () => {
    const user = await registerUser("city3");
    const category = await createCategory("CityCat3");
    const city = await makeCity("SingleCity");
    await makeApprovedEvent(city.id, category.id, user.id, `Single ${unique("t")}`);

    const res = await api().get(`/api/v1/cities/${city.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(city.slug);
    expect(res.body.data.eventCount).toBe(1);
    expect(res.body.data.state).toBeTruthy();
  });

  it("404s for an unknown city slug", async () => {
    const res = await api().get(`/api/v1/cities/${unique("nope")}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("CITY_NOT_FOUND");
  });
});

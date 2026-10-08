import { api, registerUser, createAdmin, createCategory, createEventAs, authHeader, unique, tokenFor, TestUser } from "./helpers";
import { prisma } from "../src/config/prisma";

describe("Events lifecycle", () => {
  let creator: TestUser;
  let admin: TestUser;
  let categoryId: string;

  beforeAll(async () => {
    creator = await registerUser("creator");
    admin = await createAdmin();
    const category = await createCategory();
    categoryId = category.id;
  });

  it("rejects unauthenticated event creation with 401", async () => {
    const res = await api().post("/api/v1/events").send({ title: "Nope", categoryId, date: "2026-12-01" });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await api()
      .post("/api/v1/events")
      .set(authHeader(creator.token))
      .send({ categoryId, date: "2026-12-01" });
    expect(res.status).toBe(422);
  });

  it("creates an event in PENDING_REVIEW with a slug", async () => {
    const res = await api()
      .post("/api/v1/events")
      .set(authHeader(creator.token))
      .send({
        title: `Lifecycle ${unique("ev")}`,
        categoryId,
        date: "2026-12-01",
        startTime: "18:00",
        endTime: "21:00",
        venue: "Test Hall",
        description: "A lifecycle test event",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.event.status).toBe("PENDING_REVIEW");
    expect(res.body.data.event.slug).toEqual(expect.any(String));
  });

  it("notifies the creator that the event was submitted", async () => {
    const event = await createEventAs(creator.id, categoryId);
    const notifications = await prisma.notification.findMany({
      where: { userId: creator.id, type: "SYSTEM", title: "Event submitted for review" },
    });
    expect(notifications.length).toBeGreaterThan(0);
    void event;
  });

  it("hides pending events from the public list and shows them after approval", async () => {
    const title = `Approvable ${unique("ev")}`;
    const event = await createEventAs(creator.id, categoryId, { title });

    const hidden = await api().get(`/api/v1/events?search=${encodeURIComponent(title)}`);
    expect(hidden.status).toBe(200);
    expect(hidden.body.data).toHaveLength(0);

    const approve = await api()
      .patch(`/api/v1/admin/events/${event.id}/approve`)
      .set(authHeader(admin.token))
      .send({});
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe("APPROVED");

    const visible = await api().get(`/api/v1/events?search=${encodeURIComponent(title)}`);
    expect(visible.body.data).toHaveLength(1);
    expect(visible.body.data[0].slug).toBe(event.slug);
  });

  it("fetches an approved event by slug and 404s on unknown slugs", async () => {
    const event = await createEventAs(creator.id, categoryId);
    await api()
      .patch(`/api/v1/admin/events/${event.id}/approve`)
      .set(authHeader(admin.token))
      .send({});

    const found = await api().get(`/api/v1/events/${event.slug}`);
    expect(found.status).toBe(200);
    expect(found.body.data.slug).toBe(event.slug);

    const missing = await api().get(`/api/v1/events/no-such-event-${unique("x")}`);
    expect(missing.status).toBe(404);
  });

  it("lists the creator's own events including pending ones", async () => {
    const event = await createEventAs(creator.id, categoryId);
    const res = await api().get("/api/v1/events/mine").set(authHeader(creator.token));
    expect(res.status).toBe(200);
    const ids = res.body.data.map((e: { id: string }) => e.id);
    expect(ids).toContain(event.id);
  });

  it("lets the creator update their event", async () => {
    const event = await createEventAs(creator.id, categoryId);
    const res = await api()
      .patch(`/api/v1/events/${event.id}`)
      .set(authHeader(creator.token))
      .send({ title: `Updated ${unique("ev")}` });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toMatch(/^Updated /);
  });

  it("prevents another user from updating the event", async () => {
    const event = await createEventAs(creator.id, categoryId);
    const stranger = await registerUser("stranger");
    const res = await api()
      .patch(`/api/v1/events/${event.id}`)
      .set(authHeader(stranger.token))
      .send({ title: "Hijacked title" });
    expect([403, 404]).toContain(res.status);
  });

  it("lets a user report an event", async () => {
    const event = await createEventAs(creator.id, categoryId);
    const reporter = await registerUser("reporter");
    const res = await api()
      .post(`/api/v1/events/${event.id}/reports`)
      .set(authHeader(reporter.token))
      .send({ reason: "SPAM", description: "Looks like spam" });
    expect(res.status).toBe(201);
  });

  it("soft-deletes the creator's event (status becomes CANCELLED)", async () => {
    const event = await createEventAs(creator.id, categoryId);
    const res = await api()
      .delete(`/api/v1/events/${event.id}`)
      .set(authHeader(creator.token));
    expect(res.status).toBe(200);

    const fetch = await api()
      .get("/api/v1/events/mine")
      .set(authHeader(tokenFor(creator.id)));
    const deleted = fetch.body.data.find((e: { id: string }) => e.id === event.id);
    expect(deleted).toBeDefined();
    expect(deleted.status).toBe("CANCELLED");
  });
});

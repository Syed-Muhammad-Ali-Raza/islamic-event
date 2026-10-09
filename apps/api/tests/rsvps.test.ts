import {
  api,
  registerUser,
  createAdmin,
  createCategory,
  createEventAs,
  authHeader,
  TestUser,
} from "./helpers";

async function createApprovedEvent(): Promise<{ event: { id: string; slug: string }; admin: TestUser; user: TestUser }> {
  const admin = await createAdmin("rsvp-admin");
  const user = await registerUser("rsvp-user");
  const category = await createCategory("RSVP");
  const event = await createEventAs(user.id, category.id);

  const approve = await api()
    .patch(`/api/v1/admin/events/${event.id}/approve`)
    .set(authHeader(admin.token));
  expect(approve.status).toBe(200);

  return { event, admin, user };
}

describe("Event RSVPs", () => {
  it("requires auth to RSVP", async () => {
    const { event } = await createApprovedEvent();
    const res = await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .send({ type: "INTERESTED" });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid type with 422", async () => {
    const { event, user } = await createApprovedEvent();
    const res = await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "MAYBE" });
    expect(res.status).toBe(422);
  });

  it("sets, switches and removes an RSVP", async () => {
    const { event, user } = await createApprovedEvent();

    const interested = await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "INTERESTED" });
    expect(interested.status).toBe(200);
    expect(interested.body.data.interested).toBe(1);
    expect(interested.body.data.attending).toBe(0);
    expect(interested.body.data.myRsvp).toBe("INTERESTED");

    const again = await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "INTERESTED" });
    expect(again.body.data.interested).toBe(1);

    const switched = await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "ATTENDING" });
    expect(switched.body.data.interested).toBe(0);
    expect(switched.body.data.attending).toBe(1);
    expect(switched.body.data.myRsvp).toBe("ATTENDING");

    const removed = await api()
      .delete(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token));
    expect(removed.status).toBe(200);
    expect(removed.body.data.attending).toBe(0);
    expect(removed.body.data.myRsvp).toBeNull();
  });

  it("exposes counts on the public event detail and myRsvp when authed", async () => {
    const { event, user } = await createApprovedEvent();

    await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "ATTENDING" });

    const anon = await api().get(`/api/v1/events/${event.slug}`);
    expect(anon.status).toBe(200);
    expect(anon.body.data.rsvps.attending).toBe(1);
    expect(anon.body.data.rsvps.myRsvp).toBeNull();

    const me = await api()
      .get(`/api/v1/events/${event.slug}`)
      .set(authHeader(user.token));
    expect(me.body.data.rsvps.attending).toBe(1);
    expect(me.body.data.rsvps.myRsvp).toBe("ATTENDING");
  });

  it("rejects RSVPs on events that are not approved", async () => {
    const user = await registerUser("rsvp-pending");
    const category = await createCategory("RSVP");
    const event = await createEventAs(user.id, category.id);

    const res = await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "INTERESTED" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for an unknown event", async () => {
    const user = await registerUser("rsvp-ghost");
    const res = await api()
      .put("/api/v1/events/does-not-exist/rsvps")
      .set(authHeader(user.token))
      .send({ type: "INTERESTED" });
    expect(res.status).toBe(404);
  });

  it("lets only the organizer or admin list RSVPs", async () => {
    const { event, admin, user } = await createApprovedEvent();

    await api()
      .put(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token))
      .send({ type: "ATTENDING" });

    const stranger = await registerUser("rsvp-stranger");
    const denied = await api()
      .get(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(stranger.token));
    expect(denied.status).toBe(403);

    const anon = await api().get(`/api/v1/events/${event.id}/rsvps`);
    expect(anon.status).toBe(401);

    const organizer = await api()
      .get(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(user.token));
    expect(organizer.status).toBe(200);
    expect(organizer.body.pagination.total).toBe(1);
    expect(organizer.body.data[0].user.name).toBe(user.name);
    expect(organizer.body.data[0].type).toBe("ATTENDING");

    const asAdmin = await api()
      .get(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(admin.token));
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.pagination.total).toBe(1);
  });
});

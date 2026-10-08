import { api, registerUser, createAdmin, createCategory, createEventAs, authHeader, TestUser } from "./helpers";

describe("Saved events", () => {
  let user: TestUser;
  let admin: TestUser;
  let eventId: string;

  beforeAll(async () => {
    user = await registerUser("saver");
    admin = await createAdmin();
    const category = await createCategory();
    const event = await createEventAs(user.id, category.id);
    await api()
      .patch(`/api/v1/admin/events/${event.id}/approve`)
      .set(authHeader(admin.token))
      .send({});
    eventId = event.id;
  });

  function eventIds(body: { data: Array<{ event: { id: string } }> }): string[] {
    return body.data.map((row) => row.event.id);
  }

  it("requires auth to save", async () => {
    expect((await api().post(`/api/v1/events/${eventId}/save`)).status).toBe(401);
  });

  it("saves an event and appears in the saved list", async () => {
    const save = await api()
      .post(`/api/v1/events/${eventId}/save`)
      .set(authHeader(user.token));
    expect(save.status).toBe(201);

    const list = await api()
      .get("/api/v1/users/me/saved-events")
      .set(authHeader(user.token));
    expect(list.status).toBe(200);
    expect(eventIds(list.body)).toContain(eventId);
  });

  it("unsaves the event and it leaves the list", async () => {
    const again = await api()
      .post(`/api/v1/events/${eventId}/save`)
      .set(authHeader(user.token));
    expect([201, 409]).toContain(again.status);

    const unsave = await api()
      .delete(`/api/v1/events/${eventId}/save`)
      .set(authHeader(user.token));
    expect(unsave.status).toBe(200);

    const list = await api()
      .get("/api/v1/users/me/saved-events")
      .set(authHeader(user.token));
    expect(eventIds(list.body)).not.toContain(eventId);
  });

  it("keeps saved lists isolated per user", async () => {
    const other = await registerUser("saver2");
    await api()
      .post(`/api/v1/events/${eventId}/save`)
      .set(authHeader(user.token));

    const otherList = await api()
      .get("/api/v1/users/me/saved-events")
      .set(authHeader(other.token));
    expect(eventIds(otherList.body)).not.toContain(eventId);
  });
});

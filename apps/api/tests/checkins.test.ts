import {
  api,
  registerUser,
  createAdmin,
  createCategory,
  createEventAs,
  authHeader,
  TestUser,
} from "./helpers";
import { prisma } from "../src/config/prisma";
import { runEventReminders } from "../src/services/reminder.service";

async function createApprovedEvent(
  date = "2026-12-01"
): Promise<{ event: { id: string; slug: string; title: string }; admin: TestUser; organizer: TestUser }> {
  const admin = await createAdmin("checkin-admin");
  const organizer = await registerUser("checkin-org");
  const category = await createCategory("Checkin");
  const event = await createEventAs(organizer.id, category.id, { date });

  const approve = await api()
    .patch(`/api/v1/admin/events/${event.id}/approve`)
    .set(authHeader(admin.token));
  expect(approve.status).toBe(200);

  return { event, admin, organizer };
}

async function rsvpAs(
  eventId: string,
  user: TestUser,
  type: "INTERESTED" | "ATTENDING"
): Promise<void> {
  const res = await api()
    .put(`/api/v1/events/${eventId}/rsvps`)
    .set(authHeader(user.token))
    .send({ type });
  expect(res.status).toBe(200);
}

describe("RSVP notifications", () => {
  it("notifies the organizer on a first-time RSVP (not on switches)", async () => {
    const { event, organizer } = await createApprovedEvent();
    const attendee = await registerUser("checkin-attendee");

    await rsvpAs(event.id, attendee, "ATTENDING");

    const first = await prisma.notification.findFirst({
      where: { userId: organizer.id, type: "RSVP_NEW" },
    });
    expect(first).not.toBeNull();
    expect(first!.body).toContain(attendee.name);
    expect(first!.body).toContain(event.title);

    const before = await prisma.notification.count({
      where: { userId: organizer.id, type: "RSVP_NEW" },
    });

    await rsvpAs(event.id, attendee, "INTERESTED");

    const after = await prisma.notification.count({
      where: { userId: organizer.id, type: "RSVP_NEW" },
    });
    expect(after).toBe(before);
  });

  it("does not notify the organizer about their own RSVP", async () => {
    const { event, organizer } = await createApprovedEvent();
    await rsvpAs(event.id, organizer, "ATTENDING");

    const count = await prisma.notification.count({
      where: { userId: organizer.id, type: "RSVP_NEW" },
    });
    expect(count).toBe(0);
  });

  it("sends ATTENDING users a 24h reminder exactly once", async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { event } = await createApprovedEvent(tomorrow);
    const attendee = await registerUser("checkin-reminder");
    const interested = await registerUser("checkin-not-reminded");

    await rsvpAs(event.id, attendee, "ATTENDING");
    await rsvpAs(event.id, interested, "INTERESTED");

    const first = await runEventReminders();
    expect(first.sent).toBe(1);

    const reminder = await prisma.notification.findFirst({
      where: { userId: attendee.id, type: "EVENT_REMINDER" },
    });
    expect(reminder).not.toBeNull();

    const notInterested = await prisma.notification.count({
      where: { userId: interested.id, type: "EVENT_REMINDER" },
    });
    expect(notInterested).toBe(0);

    const second = await runEventReminders();
    expect(second.sent).toBe(0);
  });

  it("does not remind for events further than 24 hours away", async () => {
    const { event } = await createApprovedEvent("2027-06-01");
    const attendee = await registerUser("checkin-far");
    await rsvpAs(event.id, attendee, "ATTENDING");

    const { sent } = await runEventReminders();
    expect(sent).toBe(0);
  });
});

describe("Attendee QR check-in", () => {
  it("returns my RSVP with a QR token (auth required)", async () => {
    const { event, organizer } = await createApprovedEvent();

    const anon = await api().get(`/api/v1/events/${event.id}/rsvps/me`);
    expect(anon.status).toBe(401);

    const none = await api()
      .get(`/api/v1/events/${event.id}/rsvps/me`)
      .set(authHeader(organizer.token));
    expect(none.status).toBe(404);

    const attendee = await registerUser("checkin-qr");
    await rsvpAs(event.id, attendee, "ATTENDING");

    const res = await api()
      .get(`/api/v1/events/${event.id}/rsvps/me`)
      .set(authHeader(attendee.token));
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe("ATTENDING");
    expect(res.body.data.qrToken).toBeTruthy();
    expect(res.body.data.checkedInAt).toBeNull();
  });

  it("checks in, flags duplicates, lists state, and undoes", async () => {
    const { event, organizer } = await createApprovedEvent();
    const attendee = await registerUser("checkin-flow");

    await rsvpAs(event.id, attendee, "ATTENDING");

    const me = await api()
      .get(`/api/v1/events/${event.id}/rsvps/me`)
      .set(authHeader(attendee.token));
    const token = me.body.data.qrToken as string;

    const anon = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .send({ code: token });
    expect(anon.status).toBe(401);

    const stranger = await registerUser("checkin-stranger");
    const denied = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .set(authHeader(stranger.token))
      .send({ code: token });
    expect(denied.status).toBe(403);

    const badCode = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .set(authHeader(organizer.token))
      .send({ code: "not-a-real-token" });
    expect(badCode.status).toBe(404);

    const first = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .set(authHeader(organizer.token))
      .send({ code: token });
    expect(first.status).toBe(200);
    expect(first.body.data.alreadyCheckedIn).toBe(false);
    expect(first.body.data.attendee.email).toBe(attendee.email);

    const again = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .set(authHeader(organizer.token))
      .send({ code: token });
    expect(again.status).toBe(200);
    expect(again.body.data.alreadyCheckedIn).toBe(true);

    const list = await api()
      .get(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(organizer.token));
    expect(list.body.counts.checkedIn).toBe(1);
    const row = list.body.data.find((r: { user: { email: string } }) => r.user.email === attendee.email);
    expect(row.checkedInAt).not.toBeNull();

    const rsvpId = row.id as string;
    const undo = await api()
      .delete(`/api/v1/events/${event.id}/checkins/${rsvpId}`)
      .set(authHeader(organizer.token));
    expect(undo.status).toBe(200);

    const afterUndo = await api()
      .get(`/api/v1/events/${event.id}/rsvps`)
      .set(authHeader(organizer.token));
    expect(afterUndo.body.counts.checkedIn).toBe(0);

    const undoAgain = await api()
      .delete(`/api/v1/events/${event.id}/checkins/${rsvpId}`)
      .set(authHeader(organizer.token));
    expect(undoAgain.status).toBe(409);
  });

  it("rejects check-in for INTERESTED-only RSVPs", async () => {
    const { event, organizer } = await createApprovedEvent();
    const interested = await registerUser("checkin-interested");
    await rsvpAs(event.id, interested, "INTERESTED");

    const me = await api()
      .get(`/api/v1/events/${event.id}/rsvps/me`)
      .set(authHeader(interested.token));

    const res = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .set(authHeader(organizer.token))
      .send({ code: me.body.data.qrToken });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("RSVP_NOT_ATTENDING");
  });

  it("rejects a QR token issued for a different event", async () => {
    const { event } = await createApprovedEvent();
    const second = await createApprovedEvent();
    const attendee = await registerUser("checkin-cross");
    await rsvpAs(event.id, attendee, "ATTENDING");

    const me = await api()
      .get(`/api/v1/events/${event.id}/rsvps/me`)
      .set(authHeader(attendee.token));

    const res = await api()
      .post(`/api/v1/events/${second.event.id}/checkins`)
      .set(authHeader(second.organizer.token))
      .send({ code: me.body.data.qrToken });
    expect(res.status).toBe(404);
  });

  it("validates the check-in payload", async () => {
    const { event, organizer } = await createApprovedEvent();
    const res = await api()
      .post(`/api/v1/events/${event.id}/checkins`)
      .set(authHeader(organizer.token))
      .send({});
    expect(res.status).toBe(422);
  });
});

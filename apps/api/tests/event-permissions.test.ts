import {
  api,
  registerUser,
  createSuperAdmin,
  createCategory,
  createEventAs,
  authHeader,
  unique,
  TestUser,
} from "./helpers";
import { prisma } from "../src/config/prisma";

// ─── Fixtures ────────────────────────────────────────────────────────────────

async function createOrg(creatorId: string): Promise<{ id: string; name: string }> {
  return prisma.organizer.create({
    data: { name: unique("Org"), slug: unique("org"), createdById: creatorId },
  });
}

async function addMember(
  organizerId: string,
  userId: string,
  role: "OWNER" | "ADMIN" | "EDITOR"
): Promise<void> {
  await prisma.organizationMember.create({ data: { userId, organizerId, role } });
}

function submitForOrg(user: TestUser, categoryId: string, organizerId: string) {
  return api()
    .post("/api/v1/events")
    .set(authHeader(user.token))
    .send({
      title: `Org Event ${unique("ev")}`,
      categoryId,
      date: "2026-12-05",
      startTime: "18:00",
      venue: unique("Venue"),
      organizerId,
    });
}

describe("Events — organization-aware submission", () => {
  let categoryId: string;
  let owner: TestUser;
  let editor: TestUser;
  let outsider: TestUser;

  beforeAll(async () => {
    owner = await registerUser("evowner");
    editor = await registerUser("eveditor");
    outsider = await registerUser("evoutsider");
    categoryId = (await createCategory()).id;
  });

  it("lets an org EDITOR submit an event for their organization (stays PENDING_REVIEW)", async () => {
    const org = await createOrg(owner.id);
    await addMember(org.id, editor.id, "EDITOR");

    const res = await submitForOrg(editor, categoryId, org.id);
    expect(res.status).toBe(201);
    expect(res.body.data.event.status).toBe("PENDING_REVIEW");
    expect(res.body.data.event.organizer?.id).toBe(org.id);
  });

  it("rejects submissions for an organization the requester does not belong to with 403", async () => {
    const org = await createOrg(owner.id);

    const res = await submitForOrg(outsider, categoryId, org.id);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("404s when submitting for an unknown or inactive organization", async () => {
    const unknown = await submitForOrg(editor, categoryId, `org_${unique("missing")}`);
    expect(unknown.status).toBe(404);

    const org = await createOrg(owner.id);
    await prisma.organizer.update({ where: { id: org.id }, data: { isActive: false } });
    const inactive = await submitForOrg(owner, categoryId, org.id);
    expect(inactive.status).toBe(404);
  });

  it("notifies the org OWNER when a member submits an event for the organization", async () => {
    const org = await createOrg(owner.id);
    await addMember(org.id, owner.id, "OWNER");
    await addMember(org.id, editor.id, "EDITOR");

    const res = await submitForOrg(editor, categoryId, org.id);
    expect(res.status).toBe(201);

    const notice = await prisma.notification.findFirst({
      where: { userId: owner.id, type: "NEW_EVENT", title: "New event submitted for your organization" },
    });
    expect(notice).not.toBeNull();
  });
});

describe("Events — organization-aware management", () => {
  let categoryId: string;
  let owner: TestUser;
  let editor: TestUser;
  let editor2: TestUser;
  let outsider: TestUser;

  beforeAll(async () => {
    owner = await registerUser("mgowner");
    editor = await registerUser("mgeditor");
    editor2 = await registerUser("mgeditor2");
    outsider = await registerUser("mgoutsider");
    categoryId = (await createCategory()).id;
  });

  it("lets an org OWNER update an event created by another member", async () => {
    const org = await createOrg(owner.id);
    await addMember(org.id, owner.id, "OWNER");
    await addMember(org.id, editor.id, "EDITOR");

    const created = await submitForOrg(editor, categoryId, org.id);
    expect(created.status).toBe(201);
    const eventId = created.body.data.event.id;

    const res = await api()
      .patch(`/api/v1/events/${eventId}`)
      .set(authHeader(owner.token))
      .send({ title: `Renamed ${unique("ev")}` });
    expect(res.status).toBe(200);
  });

  it("blocks org EDITORs from updating an event they did not create", async () => {
    const org = await createOrg(owner.id);
    await addMember(org.id, owner.id, "OWNER");
    await addMember(org.id, editor.id, "EDITOR");
    await addMember(org.id, editor2.id, "EDITOR");

    const created = await submitForOrg(owner, categoryId, org.id);
    const eventId = created.body.data.event.id;

    const res = await api()
      .patch(`/api/v1/events/${eventId}`)
      .set(authHeader(editor2.token))
      .send({ title: `Hijack ${unique("ev")}` });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("keeps the organization's creator able to manage events without a membership row", async () => {
    // Organizations created before the membership system have no rows — the
    // creator stays an implicit owner. The editor submits (as a member), the
    // org's creator manages the event despite having no membership row.
    const org = await createOrg(owner.id);
    await addMember(org.id, editor.id, "EDITOR");
    const created = await submitForOrg(editor, categoryId, org.id);
    expect(created.status).toBe(201);
    const eventId = created.body.data.event.id;

    const res = await api()
      .patch(`/api/v1/events/${eventId}`)
      .set(authHeader(owner.token))
      .send({ title: `Legacy ${unique("ev")}` });
    expect(res.status).toBe(200);
  });

  it("blocks re-assigning an event to an organization the requester does not belong to", async () => {
    const event = await createEventAs(outsider.id, categoryId);
    const foreignOrg = await createOrg(owner.id);

    const res = await api()
      .patch(`/api/v1/events/${event.id}`)
      .set(authHeader(outsider.token))
      .send({ organizerId: foreignOrg.id });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("lets a platform super admin update any event", async () => {
    const superAdmin = await createSuperAdmin("evsuper");
    const event = await createEventAs(outsider.id, categoryId);

    const res = await api()
      .patch(`/api/v1/events/${event.id}`)
      .set(authHeader(superAdmin.token))
      .send({ title: `SA ${unique("ev")}` });
    expect(res.status).toBe(200);
  });

  it("lets an org ADMIN soft-delete an event (status CANCELLED)", async () => {
    const adminMember = await registerUser("mgadmin");
    const org = await createOrg(owner.id);
    await addMember(org.id, adminMember.id, "ADMIN");
    await addMember(org.id, editor.id, "EDITOR");

    const created = await submitForOrg(editor, categoryId, org.id);
    const eventId = created.body.data.event.id;

    const res = await api()
      .delete(`/api/v1/events/${eventId}`)
      .set(authHeader(adminMember.token));
    expect(res.status).toBe(200);

    const row = await prisma.event.findUnique({ where: { id: eventId }, select: { status: true } });
    expect(row?.status).toBe("CANCELLED");
  });

  it("scopes the RSVP roster and check-in to org OWNER/ADMIN — EDITORs get 403", async () => {
    const org = await createOrg(owner.id);
    await addMember(org.id, owner.id, "OWNER");
    await addMember(org.id, editor.id, "EDITOR");
    await addMember(org.id, editor2.id, "EDITOR");

    const created = await submitForOrg(editor, categoryId, org.id);
    const eventId = created.body.data.event.id;

    const ownerRoster = await api()
      .get(`/api/v1/events/${eventId}/rsvps`)
      .set(authHeader(owner.token));
    expect(ownerRoster.status).toBe(200);
    expect(Array.isArray(ownerRoster.body.data)).toBe(true);

    const editorRoster = await api()
      .get(`/api/v1/events/${eventId}/rsvps`)
      .set(authHeader(editor2.token));
    expect(editorRoster.status).toBe(403);

    const editorCsv = await api()
      .get(`/api/v1/events/${eventId}/rsvps/export`)
      .set(authHeader(editor2.token));
    expect(editorCsv.status).toBe(403);

    // Permission is checked before the QR token is even parsed
    const editorCheckin = await api()
      .post(`/api/v1/events/${eventId}/checkins`)
      .set(authHeader(editor2.token))
      .send({ code: "bogus-qr" });
    expect(editorCheckin.status).toBe(403);
  });
});

describe("Events — public list never leaks unapproved content", () => {
  it("ignores a status query param and hides pending events from the public list", async () => {
    const creator = await registerUser("evlist");
    const categoryId = (await createCategory()).id;
    const title = `Leaky ${unique("ev")}`;
    await createEventAs(creator.id, categoryId, { title });

    // Even explicitly asking for PENDING_REVIEW must not reveal it
    const res = await api().get(`/api/v1/events?status=PENDING_REVIEW&search=${encodeURIComponent(title)}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);

    // The creator still sees it via /events/mine
    const mine = await api()
      .get("/api/v1/events/mine")
      .set(authHeader(creator.token));
    expect(mine.status).toBe(200);
    expect(mine.body.data.map((e: { title: string }) => e.title)).toContain(title);
  });
});

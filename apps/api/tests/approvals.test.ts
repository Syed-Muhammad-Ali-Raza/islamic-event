import {
  api,
  registerUser,
  createSuperAdmin,
  authHeader,
  unique,
  TestUser,
} from "./helpers";
import { prisma } from "../src/config/prisma";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const myUsers: TestUser[] = [];

async function newUser(prefix: string): Promise<TestUser> {
  const user = await registerUser(prefix);
  myUsers.push(user);
  return user;
}

async function createOrg(creatorId: string): Promise<{ id: string; name: string }> {
  const org = await prisma.organizer.create({
    data: { name: unique("Org"), slug: unique("org"), createdById: creatorId },
  });
  // There is deliberately no auto-membership on org creation (step 2) —
  // super admins create orgs and grant roles explicitly. Mirror that by
  // making the fixture creator an OWNER member.
  await addMember(org.id, creatorId, "OWNER");
  return org;
}

async function addMember(
  organizerId: string,
  userId: string,
  role: "OWNER" | "ADMIN" | "EDITOR"
): Promise<void> {
  await prisma.organizationMember.create({ data: { userId, organizerId, role } });
}

function createSubmission(user: TestUser, route: string, payload: Record<string, unknown>) {
  return api().post(`/api/v1/${route}`).set(authHeader(user.token)).send(payload);
}

function queue(user: TestUser, qs = "") {
  return api().get(`/api/v1/approvals${qs}`).set(authHeader(user.token));
}

// Minimal valid content per module (required fields only).
function minimalPayloads(): Array<{ route: string; payload: Record<string, unknown> }> {
  const n = unique("min");
  return [
    { route: "dastarkhwans", payload: { name: `Dsh ${n}`, city: "Lahore", address: "Street 1", type: "Free langar" } },
    { route: "imambargahs", payload: { name: `Imb ${n}`, city: "Lahore", address: "Street 1", confidence: "high" } },
    { route: "places", payload: { name: `Plc ${n}`, category: "Historical", type: "Fort", city: "Lahore", province: "Punjab", address: "Street 1" } },
    { route: "darbars", payload: { name: `Dbr ${n}`, saint: "Some Saint", city: "Lahore", province: "Punjab", address: "Street 1" } },
    { route: "urs-dates", payload: { name: `Urs ${n}`, saint: "Some Saint", city: "Lahore", confidence: "medium" } },
    { route: "processions", payload: { name: `Prn ${n}`, city: "Lahore", month: "Muharram", day: "10" } },
    { route: "charities", payload: { name: `Chy ${n}`, country: "Pakistan", province: "Punjab", city: "Lahore" } },
    { route: "melas", payload: { name: `Mla ${n}`, city: "Lahore", province: "Punjab" } },
    { route: "scholars", payload: { name: `Sch ${n}`, sect: "SUNNI", category: "SCHOLAR" } },
  ];
}

// The whole suite submits through the API, so every row it creates carries a
// generated "user-" sourceId. Directory test files that assert unfiltered
// totals may run before OR after this one (the DB resets once per run), so we
// remove our rows — otherwise public-list counts would leak across files.
afterAll(async () => {
  const prefix = { startsWith: "user-" };
  await Promise.all([
    prisma.dastarkhwan.deleteMany({ where: { sourceId: prefix } }),
    prisma.imambargah.deleteMany({ where: { sourceId: prefix } }),
    prisma.place.deleteMany({ where: { sourceId: prefix } }),
    prisma.darbar.deleteMany({ where: { sourceId: prefix } }),
    prisma.ursDate.deleteMany({ where: { sourceId: prefix } }),
    prisma.procession.deleteMany({ where: { sourceId: prefix } }),
    prisma.charity.deleteMany({ where: { sourceId: prefix } }),
    prisma.mela.deleteMany({ where: { sourceId: prefix } }),
    prisma.scholar.deleteMany({ where: { sourceId: prefix } }),
    prisma.notification.deleteMany({ where: { userId: { in: myUsers.map((u) => u.id) } } }),
  ]);
});

// ─── Creation ────────────────────────────────────────────────────────────────

describe("Directory submissions — creation", () => {
  it("creates a PENDING submission that stays hidden from the public directory", async () => {
    const user = await newUser("dir");
    const name = `Hidden Point ${unique("ds")}`;

    const res = await createSubmission(user, "dastarkhwans", {
      name,
      city: "Lahore",
      address: "Street 1, Lahore",
      type: "Free langar",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe("PENDING");
    expect(res.body.data.sourceId).toMatch(/^user-/);
    expect(res.body.data.submittedById).toBe(user.id);

    const list = await api().get(`/api/v1/dastarkhwans?q=${encodeURIComponent(name)}`);
    expect(list.body.pagination.total).toBe(0);

    const detail = await api().get(`/api/v1/dastarkhwans/${res.body.data.sourceId}`);
    expect(detail.status).toBe(404);
  });

  it("publishes super-admin creations immediately (APPROVED + publicly visible)", async () => {
    const superadmin = await createSuperAdmin("dirs");
    const name = `Curated Place ${unique("pl")}`;

    const res = await createSubmission(superadmin, "places", {
      name,
      category: "Historical",
      type: "Fort",
      city: "Lahore",
      province: "Punjab",
      address: "Fort Road, Lahore",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe("APPROVED");

    const list = await api().get(`/api/v1/places?q=${encodeURIComponent(name)}`);
    expect(list.body.pagination.total).toBe(1);

    const detail = await api().get(`/api/v1/places/${res.body.data.sourceId}`);
    expect(detail.status).toBe(200);
  });

  it("403s submissions for a foreign organization and 404s unknown organizations", async () => {
    const owner = await newUser("fowner");
    const outsider = await newUser("fout");
    const org = await createOrg(owner.id);

    const forbidden = await createSubmission(outsider, "darbars", {
      name: unique("Dbr"),
      saint: "Some Saint",
      city: "Lahore",
      province: "Punjab",
      address: "Street 1",
      organizerId: org.id,
    });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe("FORBIDDEN");

    const missing = await createSubmission(outsider, "darbars", {
      name: unique("Dbr"),
      saint: "Some Saint",
      city: "Lahore",
      province: "Punjab",
      address: "Street 1",
      organizerId: `org_${unique("missing")}`,
    });
    expect(missing.status).toBe(404);
  });

  it("accepts a minimal valid submission in all nine modules (all PENDING)", async () => {
    const user = await newUser("mods");
    for (const { route, payload } of minimalPayloads()) {
      const res = await createSubmission(user, route, payload);
      expect(res.status).toBe(201);
      expect(res.body.data.approvalStatus).toBe("PENDING");
      expect(res.body.data.sourceId).toMatch(/^user-/);
    }
  });

  it("422s a submission missing required fields and 401s unauthenticated", async () => {
    const user = await newUser("val");
    const invalid = await createSubmission(user, "dastarkhwans", { name: "No city" });
    expect(invalid.status).toBe(422);

    const anon = await api().post("/api/v1/dastarkhwans").send({ name: "Anon", city: "Lahore", address: "Street 1", type: "x" });
    expect(anon.status).toBe(401);
  });

  it("notifies the submitter and the org OWNER/ADMIN on submission", async () => {
    const owner = await newUser("nowner");
    const admin = await newUser("nadmin");
    const editor = await newUser("neditor");
    const org = await createOrg(owner.id);
    await addMember(org.id, admin.id, "ADMIN");
    await addMember(org.id, editor.id, "EDITOR");

    const name = `Notified Darbar ${unique("nd")}`;
    const res = await createSubmission(editor, "darbars", {
      name,
      saint: "Some Saint",
      city: "Lahore",
      province: "Punjab",
      address: "Street 1",
      organizerId: org.id,
    });
    expect(res.status).toBe(201);

    const received = await prisma.notification.findMany({
      where: { userId: editor.id, type: "SUBMISSION_RECEIVED" },
    });
    expect(received.some((n) => n.body?.includes(name))).toBe(true);

    for (const reviewer of [owner, admin]) {
      const notices = await prisma.notification.findMany({
        where: { userId: reviewer.id, type: "NEW_SUBMISSION" },
      });
      expect(notices.some((n) => n.body?.includes(name))).toBe(true);
    }
  });
});

// ─── Moderation permissions ──────────────────────────────────────────────────

describe("Directory submissions — moderation", () => {
  async function orgSubmission() {
    const owner = await newUser("mowner");
    const editor = await newUser("meditor");
    const org = await createOrg(owner.id);
    await addMember(org.id, editor.id, "EDITOR");
    const name = `Review Darbar ${unique("rd")}`;
    const res = await createSubmission(editor, "darbars", {
      name,
      saint: "Some Saint",
      city: "Lahore",
      province: "Punjab",
      address: "Street 1",
      organizerId: org.id,
    });
    if (res.status !== 201) throw new Error(`orgSubmission failed: ${res.status}`);
    return { owner, editor, org, name, row: res.body.data as { id: string; sourceId: string } };
  }

  it("lets the org OWNER approve, which makes the row publicly visible", async () => {
    const { owner, name, row } = await orgSubmission();

    const before = await api().get(`/api/v1/darbars?q=${encodeURIComponent(name)}`);
    expect(before.body.pagination.total).toBe(0);

    const res = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe("APPROVED");

    const after = await api().get(`/api/v1/darbars?q=${encodeURIComponent(name)}`);
    expect(after.body.pagination.total).toBe(1);
    const detail = await api().get(`/api/v1/darbars/${row.sourceId}`);
    expect(detail.status).toBe(200);
  });

  it("lets the org ADMIN approve their organization's submission", async () => {
    const { org, row } = await orgSubmission();
    const admin = await newUser("madmin");
    await addMember(org.id, admin.id, "ADMIN");

    const res = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe("APPROVED");
  });

  it("blocks org EDITORs, outsiders and self-approval with 403", async () => {
    // EDITOR cannot approve their org's submission.
    const { editor, owner, row } = await orgSubmission();
    const editorApprove = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(editor.token));
    expect(editorApprove.status).toBe(403);

    // Unrelated user cannot approve either.
    const outsider = await newUser("mout");
    const outsiderApprove = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(outsider.token));
    expect(outsiderApprove.status).toBe(403);

    // Creator of an un-org'd row cannot approve their own submission.
    const self = await newUser("mself");
    const created = await createSubmission(self, "melas", {
      name: `Self Mela ${unique("sm")}`,
      city: "Lahore",
      province: "Punjab",
    });
    expect(created.status).toBe(201);
    const selfApprove = await api()
      .post(`/api/v1/melas/${created.body.data.id}/approve`)
      .set(authHeader(self.token));
    expect(selfApprove.status).toBe(403);

    // The org OWNER can still approve the org row (sanity: fixture worked).
    const ownerApprove = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(owner.token));
    expect(ownerApprove.status).toBe(200);
  });

  it("lets a super admin approve any submission, including un-org'd ones", async () => {
    const superadmin = await createSuperAdmin("msuper");
    const user = await newUser("mpend");
    const created = await createSubmission(user, "melas", {
      name: `Super Mela ${unique("sm")}`,
      city: "Lahore",
      province: "Punjab",
    });
    expect(created.status).toBe(201);

    const res = await api()
      .post(`/api/v1/melas/${created.body.data.id}/approve`)
      .set(authHeader(superadmin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe("APPROVED");
  });

  it("rejects with a stored reason and notifies the submitter", async () => {
    const { owner, editor, name, row } = await orgSubmission();
    const reason = "Missing address details";

    const res = await api()
      .post(`/api/v1/darbars/${row.id}/reject`)
      .set(authHeader(owner.token))
      .send({ reason });
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe("REJECTED");
    expect(res.body.data.rejectionReason).toBe(reason);

    // Rejected rows are not public.
    const detail = await api().get(`/api/v1/darbars/${row.sourceId}`);
    expect(detail.status).toBe(404);

    const notices = await prisma.notification.findMany({
      where: { userId: editor.id, type: "SUBMISSION_REJECTED" },
    });
    expect(notices.some((n) => n.body?.includes(name) && n.body?.includes(reason))).toBe(true);
  });

  it("409s double approvals/rejections and 404s unknown ids", async () => {
    const superadmin = await createSuperAdmin("mdup");
    const { owner, row } = await orgSubmission();

    const first = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(owner.token));
    expect(first.status).toBe(200);

    const again = await api()
      .post(`/api/v1/darbars/${row.id}/approve`)
      .set(authHeader(superadmin.token));
    expect(again.status).toBe(409);
    expect(again.body.code).toBe("ALREADY_APPROVED");

    const rejected = await api()
      .post(`/api/v1/darbars/${row.id}/reject`)
      .set(authHeader(owner.token))
      .send({ reason: "Needs work" });
    expect(rejected.status).toBe(200);

    const rejectAgain = await api()
      .post(`/api/v1/darbars/${row.id}/reject`)
      .set(authHeader(superadmin.token))
      .send({ reason: "Needs work" });
    expect(rejectAgain.status).toBe(409);
    expect(rejectAgain.body.code).toBe("ALREADY_REJECTED");

    const missing = await api()
      .post(`/api/v1/places/post_${unique("missing")}/approve`)
      .set(authHeader(superadmin.token));
    expect(missing.status).toBe(404);
  });
});

// ─── GET /approvals queue ────────────────────────────────────────────────────

describe("GET /api/v1/approvals — permission-scoped queue", () => {
  it("401s unauthenticated requests", async () => {
    const res = await api().get("/api/v1/approvals");
    expect(res.status).toBe(401);
  });

  it("shows super admins every pending submission across modules", async () => {
    const superadmin = await createSuperAdmin("qsuper");
    const a = await newUser("qa");
    const b = await newUser("qb");

    const placeName = `Queue Place ${unique("qp")}`;
    const charityName = `Queue Charity ${unique("qc")}`;
    await createSubmission(a, "places", {
      name: placeName, category: "Historical", type: "Tomb", city: "Lahore", province: "Punjab", address: "Street 1",
    });
    await createSubmission(b, "charities", {
      name: charityName, country: "Pakistan", province: "Punjab", city: "Lahore",
    });

    const res = await queue(superadmin);
    expect(res.status).toBe(200);
    const items = res.body.data as Array<{ module: string; name: string }>;
    expect(items.some((i) => i.module === "place" && i.name === placeName)).toBe(true);
    expect(items.some((i) => i.module === "charity" && i.name === charityName)).toBe(true);

    // Module filter narrows the queue.
    const filtered = await queue(superadmin, "?module=charity");
    const filteredItems = filtered.body.data as Array<{ module: string }>;
    expect(filteredItems.length).toBeGreaterThan(0);
    expect(filteredItems.every((i) => i.module === "charity")).toBe(true);
  });

  it("scopes org OWNER/ADMIN to their organizations' rows plus their own", async () => {
    const owner = await newUser("qowner");
    const editor = await newUser("qeditor");
    const outsider = await newUser("qout");
    const org = await createOrg(owner.id);
    await addMember(org.id, editor.id, "EDITOR");

    const orgName = `Org Queue Darbar ${unique("oq")}`;
    await createSubmission(editor, "darbars", {
      name: orgName, saint: "Some Saint", city: "Lahore", province: "Punjab", address: "Street 1",
      organizerId: org.id,
    });
    const personalName = `Personal Queue Mela ${unique("pq")}`;
    await createSubmission(outsider, "melas", { name: personalName, city: "Karachi", province: "Sindh" });

    const ownerQueue = await queue(owner);
    const ownerItems = ownerQueue.body.data as Array<{ name: string; submittedById: string }>;
    expect(ownerItems.some((i) => i.name === orgName)).toBe(true);
    expect(ownerItems.some((i) => i.name === personalName)).toBe(false);

    const adminlessUser = await newUser("qplain");
    const empty = await queue(adminlessUser);
    expect(empty.body.pagination.total).toBe(0);
  });

  it("shows EDITORs and regular users their own submissions only", async () => {
    const owner = await newUser("qown2");
    const editor = await newUser("qedit2");
    const org = await createOrg(owner.id);
    await addMember(org.id, editor.id, "EDITOR");

    const editorName = `Editor Queue Mela ${unique("eq")}`;
    await createSubmission(editor, "melas", {
      name: editorName, city: "Lahore", province: "Punjab", organizerId: org.id,
    });
    const ownerName = `Owner Queue Mela ${unique("oq2")}`;
    await createSubmission(owner, "melas", { name: ownerName, city: "Lahore", province: "Punjab" });

    const editorQueue = await queue(editor);
    const editorItems = editorQueue.body.data as Array<{ name: string; submittedById: string }>;
    expect(editorItems.some((i) => i.name === editorName)).toBe(true);
    // Not OWNER/ADMIN → the organization's other rows stay out of scope.
    expect(editorItems.some((i) => i.name === ownerName)).toBe(false);

    const mine = await queue(editor, "?mine=true&status=ALL");
    const mineItems = mine.body.data as Array<{ name: string; submittedById: string }>;
    expect(mineItems.some((i) => i.name === editorName && i.submittedById === editor.id)).toBe(true);
    expect(mineItems.some((i) => i.name === ownerName)).toBe(false);
  });

  it("supports status filtering for reviewed rows", async () => {
    const superadmin = await createSuperAdmin("qrev");
    const owner = await newUser("qrevown");
    const org = await createOrg(owner.id);
    const name = `Approved Queue Darbar ${unique("aq")}`;
    const created = await createSubmission(owner, "darbars", {
      name, saint: "Some Saint", city: "Lahore", province: "Punjab", address: "Street 1",
      organizerId: org.id,
    });
    const row = created.body.data as { id: string };

    const pending = await queue(owner);
    const pendingItems = pending.body.data as Array<{ id: string }>;
    expect(pendingItems.some((i) => i.id === row.id)).toBe(true);

    await api().post(`/api/v1/darbars/${row.id}/approve`).set(authHeader(owner.token));

    const approved = await queue(superadmin, "?status=APPROVED");
    const approvedItems = approved.body.data as Array<{ id: string; approvalStatus: string }>;
    expect(approvedItems.some((i) => i.id === row.id && i.approvalStatus === "APPROVED")).toBe(true);

    const stillPending = await queue(owner);
    const stillPendingItems = stillPending.body.data as Array<{ id: string }>;
    expect(stillPendingItems.some((i) => i.id === row.id)).toBe(false);
  });
});

// ─── Edits ───────────────────────────────────────────────────────────────────

describe("Directory submissions — edits", () => {
  it("keeps a submitter's edit of their own row in PENDING", async () => {
    const user = await newUser("ed");
    const created = await createSubmission(user, "dastarkhwans", {
      name: `Edit Point ${unique("ep")}`,
      city: "Lahore",
      address: "Street 1, Lahore",
      type: "Free langar",
    });
    expect(created.status).toBe(201);

    const res = await api()
      .patch(`/api/v1/dastarkhwans/${created.body.data.id}`)
      .set(authHeader(user.token))
      .send({ notes: "Added schedule details" });
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe("PENDING");
  });

  it("drops an APPROVED org row back to PENDING when a member edits it", async () => {
    const owner = await newUser("edown");
    const org = await createOrg(owner.id);
    const name = `Reapproved Darbar ${unique("ra")}`;
    const created = await createSubmission(owner, "darbars", {
      name, saint: "Some Saint", city: "Lahore", province: "Punjab", address: "Street 1",
      organizerId: org.id,
    });
    await api().post(`/api/v1/darbars/${created.body.data.id}/approve`).set(authHeader(owner.token));

    const visible = await api().get(`/api/v1/darbars?q=${encodeURIComponent(name)}`);
    expect(visible.body.pagination.total).toBe(1);

    const res = await api()
      .patch(`/api/v1/darbars/${created.body.data.id}`)
      .set(authHeader(owner.token))
      .send({ timings: "Daily, after Maghrib" });
    expect(res.status).toBe(200);
    expect(res.body.data.approvalStatus).toBe("PENDING");

    const hidden = await api().get(`/api/v1/darbars?q=${encodeURIComponent(name)}`);
    expect(hidden.body.pagination.total).toBe(0);
  });

  it("blocks edits from non-members, keeps super-admin edits APPROVED, and validates org reassignment", async () => {
    const superadmin = await createSuperAdmin("edsuper");
    const owner = await newUser("edown2");
    const outsider = await newUser("edout");
    const org = await createOrg(owner.id);

    const created = await createSubmission(owner, "places", {
      name: `Guarded Place ${unique("gp")}`,
      category: "Religious", type: "Shrine", city: "Lahore", province: "Punjab", address: "Street 1",
      organizerId: org.id,
    });
    const id = created.body.data.id as string;
    await api().post(`/api/v1/places/${id}/approve`).set(authHeader(superadmin.token));

    // Outsider cannot edit an organization's row.
    const blocked = await api()
      .patch(`/api/v1/places/${id}`)
      .set(authHeader(outsider.token))
      .send({ description: "Vandal edit" });
    expect(blocked.status).toBe(403);

    // Super-admin edits are curated in place — the row stays public.
    const curated = await api()
      .patch(`/api/v1/places/${id}`)
      .set(authHeader(superadmin.token))
      .send({ description: "Curator clarification" });
    expect(curated.status).toBe(200);
    expect(curated.body.data.approvalStatus).toBe("APPROVED");

    // Moving a row to an organization you don't belong to is forbidden.
    const foreignOrg = await createOrg(outsider.id);
    const moved = await api()
      .patch(`/api/v1/places/${id}`)
      .set(authHeader(owner.token))
      .send({ organizerId: foreignOrg.id });
    expect(moved.status).toBe(403);

    // Unknown id → 404.
    const missing = await api()
      .patch(`/api/v1/places/post_${unique("missing")}`)
      .set(authHeader(superadmin.token))
      .send({ description: "x" });
    expect(missing.status).toBe(404);
  });
});

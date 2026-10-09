import { api, registerUser, unique, authHeader } from "./helpers";

describe("GET /api/v1/organizers", () => {
  it("returns a paginated list", async () => {
    const res = await api().get("/api/v1/organizers");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(typeof res.body.pagination.total).toBe("number");
  });

  it("filters by search term", async () => {
    const user = await registerUser("orgsearch");
    const name = `Masjid-e-${unique("test")}`;
    await api()
      .post("/api/v1/organizers")
      .set(authHeader(user.token))
      .send({ name });

    const res = await api().get(`/api/v1/organizers?search=${encodeURIComponent(name)}`);
    expect(res.status).toBe(200);
    const names = res.body.data.map((o: { name: string }) => o.name);
    expect(names).toContain(name);
  });
});

describe("GET /api/v1/organizers/:slug", () => {
  it("returns the organizer with an approved event count", async () => {
    const user = await registerUser("orgowner");
    const name = `Committee ${unique("test")}`;
    const create = await api()
      .post("/api/v1/organizers")
      .set(authHeader(user.token))
      .send({ name, description: "Community committee for tests" });
    expect(create.status).toBe(201);
    expect(create.body.data.slug).toEqual(expect.any(String));

    const res = await api().get(`/api/v1/organizers/${create.body.data.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data.description).toBe("Community committee for tests");
    expect(res.body.data._count.events).toBe(0);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await api().get(`/api/v1/organizers/${unique("ghost")}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/organizers", () => {
  it("requires authentication", async () => {
    const res = await api().post("/api/v1/organizers").send({ name: "No Auth Org" });
    expect(res.status).toBe(401);
  });

  it("creates an organizer for an authenticated user", async () => {
    const user = await registerUser("orgcreate");
    const name = `Eid Gah ${unique("test")}`;
    const res = await api()
      .post("/api/v1/organizers")
      .set(authHeader(user.token))
      .send({ name, phone: "+92 300 1234567" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data.createdById).toBe(user.id);
    expect(res.body.data.isVerified).toBe(false);
  });

  it("rejects an empty payload with 422", async () => {
    const user = await registerUser("orgempty");
    const res = await api()
      .post("/api/v1/organizers")
      .set(authHeader(user.token))
      .send({});
    expect(res.status).toBe(422);
  });

  it("strips privileged fields such as isVerified from the payload", async () => {
    const user = await registerUser("orginject");
    const name = `Injection ${unique("test")}`;
    const res = await api()
      .post("/api/v1/organizers")
      .set(authHeader(user.token))
      .send({ name, isVerified: true, createdById: "someone-else", slug: "hijacked" });

    expect(res.status).toBe(201);
    expect(res.body.data.isVerified).toBe(false);
    expect(res.body.data.createdById).toBe(user.id);
    expect(res.body.data.slug).not.toBe("hijacked");
  });
});

import { api, createAdmin, authHeader, unique, TestUser } from "./helpers";

describe("Categories", () => {
  let admin: TestUser;

  beforeAll(async () => {
    admin = await createAdmin();
  });

  it("lists categories publicly", async () => {
    const res = await api().get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("requires admin to create (401 then 403)", async () => {
    const anon = await api().post("/api/v1/categories").send({ name: "Nope" });
    expect(anon.status).toBe(401);

    const user = await api()
      .post("/api/v1/auth/register")
      .send({ name: "Regular", email: `${unique("reg")}@test.dev`, password: "Password123!" });
    const forbidden = await api()
      .post("/api/v1/categories")
      .set(authHeader(user.body.data.accessToken))
      .send({ name: "Nope" });
    expect(forbidden.status).toBe(403);
  });

  it("creates a category as admin and fetches it by slug", async () => {
    const name = `Workshops ${unique("cat")}`;
    const created = await api()
      .post("/api/v1/categories")
      .set(authHeader(admin.token))
      .send({ name, description: "Test category" });

    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe(name);
    expect(created.body.data.slug).toEqual(expect.any(String));

    const fetched = await api().get(`/api/v1/categories/${created.body.data.slug}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(created.body.data.id);
  });

  it("404s on an unknown slug", async () => {
    const res = await api().get(`/api/v1/categories/nope-${unique("slug")}`);
    expect(res.status).toBe(404);
  });

  it("soft-deletes (deactivates) a category", async () => {
    const created = await api()
      .post("/api/v1/categories")
      .set(authHeader(admin.token))
      .send({ name: `Temp ${unique("cat")}` });

    const del = await api()
      .delete(`/api/v1/categories/${created.body.data.id}`)
      .set(authHeader(admin.token));
    expect(del.status).toBe(200);

    const list = await api().get("/api/v1/categories");
    const ids = list.body.data.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(created.body.data.id);
  });
});

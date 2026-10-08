import { api } from "./helpers";

describe("Health & routing", () => {
  it("GET /health returns ok", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET unknown API route returns 404", async () => {
    const res = await api().get("/api/v1/definitely-not-a-route");
    expect(res.status).toBe(404);
  });

  it("GET /api/v1/events is public", async () => {
    const res = await api().get("/api/v1/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.pagination.total).toBe("number");
  });

  it("GET /api/v1/categories is public", async () => {
    const res = await api().get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

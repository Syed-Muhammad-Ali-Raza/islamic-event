import { api, unique } from "./helpers";
import { prisma } from "../src/config/prisma";
import { PUBLIC_CACHE_CONTROL } from "../src/middleware/cache.middleware";

// The CDN only caches what the API marks public, so these assertions pin the
// exact split between "same for everyone" and "user-specific" responses.
describe("Edge cache headers", () => {
  it("marks public directory reads as shared-cacheable", async () => {
    const res = await api().get("/api/v1/dastarkhwans?limit=5");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe(PUBLIC_CACHE_CONTROL);
  });

  it("keeps the header on filtered and paged URLs", async () => {
    const res = await api().get("/api/v1/scholars?city=Lahore&page=2");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe(PUBLIC_CACHE_CONTROL);
  });

  it("covers single directory rows too", async () => {
    const sourceId = unique("cache-place");
    await prisma.place.create({
      data: {
        sourceId,
        name: "Cache Probe Place",
        category: "Cultural",
        type: "Monument",
        city: "Lahore",
        province: "Punjab",
        address: "Somewhere",
      },
    });

    try {
      const res = await api().get(`/api/v1/places/${sourceId}`);

      expect(res.status).toBe(200);
      expect(res.headers["cache-control"]).toBe(PUBLIC_CACHE_CONTROL);
    } finally {
      // Suites share one database, so the fixture must not outlive this test
      // (places.test.ts asserts on the total row count).
      await prisma.place.deleteMany({ where: { sourceId } });
    }
  });

  it("never shares a response that carries an Authorization header", async () => {
    const res = await api()
      .get("/api/v1/dastarkhwans?limit=5")
      .set("Authorization", "Bearer some-user-token");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("never caches event responses (they embed isSaved / myRsvp)", async () => {
    const res = await api().get("/api/v1/events?limit=1");

    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("never caches auth or admin routes", async () => {
    const auth = await api().post("/api/v1/auth/login").send({
      email: "nobody@test.dev",
      password: "WrongPass1!",
    });
    const admin = await api().get("/api/v1/admin/stats");

    expect(auth.headers["cache-control"]).toBeUndefined();
    expect(admin.headers["cache-control"]).toBeUndefined();
  });

  it("only marks reads, never writes", async () => {
    const res = await api().patch("/api/v1/dastarkhwans/some-id").send({});

    expect(res.headers["cache-control"]).toBeUndefined();
  });
});

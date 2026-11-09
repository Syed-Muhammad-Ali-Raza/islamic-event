import request from "supertest";
import app from "../src/app";

// The reminder sweep is only reachable with the CRON_SECRET bearer token that
// Vercel attaches to scheduled invocations. It must never be public.
const URL = "/api/v1/internal/reminders";

describe("internal cron endpoints", () => {
  it("returns 401 without an Authorization header", async () => {
    const res = await request(app).get(URL);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 for a wrong secret", async () => {
    const res = await request(app).get(URL).set("Authorization", "Bearer nope");
    expect(res.status).toBe(401);
  });

  it("runs the reminder sweep with the configured secret", async () => {
    const res = await request(app)
      .get(URL)
      .set("Authorization", "Bearer test-cron-secret");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.sent).toBe("number");
  });
});

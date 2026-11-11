import express from "express";
import request from "supertest";
import { createLimiter } from "../src/middleware/rateLimit.middleware";

// These tests exercise the limiter factory directly: the app-wide instances are
// bypassed when NODE_ENV=test (otherwise suites would throttle each other), so a
// small standalone Express app is the only place the 429 path is observable.
function buildApp(options: Parameters<typeof createLimiter>[0]) {
  const app = express();
  app.use(express.json());
  app.post("/login", createLimiter(options), (req, res) => {
    const success = req.body?.ok === true;
    res.status(success ? 200 : 401).json({ success });
  });
  app.get("/read", createLimiter({ ...options, skipSuccessfulRequests: false }), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

const message = "Too many failed login attempts. Please try again in 15 minutes.";

describe("Rate limiting: createLimiter", () => {
  it("allows requests up to max, then returns 429 RATE_LIMITED", async () => {
    const app = buildApp({ max: 3, message });

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/read");
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get("/read");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      success: false,
      message,
      code: "RATE_LIMITED",
    });
  });

  it("exposes standard rate-limit headers and decrements the remaining count", async () => {
    const app = buildApp({ max: 5, message });

    const first = await request(app).get("/read");
    const second = await request(app).get("/read");

    expect(first.headers["ratelimit-limit"]).toBe("5");
    expect(Number(first.headers["ratelimit-remaining"])).toBeGreaterThan(
      Number(second.headers["ratelimit-remaining"])
    );
    expect(second.headers["ratelimit-policy"]).toBe("5;w=900");
  });

  it("does not count successful requests when skipSuccessfulRequests is set", async () => {
    const app = buildApp({ max: 2, message, skipSuccessfulRequests: true });

    // Two successful logins would exhaust a counting limiter; they must not.
    for (let i = 0; i < 2; i++) {
      const ok = await request(app).post("/login").send({ ok: true });
      expect(ok.status).toBe(200);
    }

    // Only failures consume the budget.
    const fail1 = await request(app).post("/login").send({ ok: false });
    const fail2 = await request(app).post("/login").send({ ok: false });
    expect(fail1.status).toBe(401);
    expect(fail2.status).toBe(401);

    const blocked = await request(app).post("/login").send({ ok: false });
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe("RATE_LIMITED");

    // A correct password is still rejected while the window is open, so the
    // limiter runs before the controller — never after password verification.
    const alsoBlocked = await request(app).post("/login").send({ ok: true });
    expect(alsoBlocked.status).toBe(429);
  });

  it("keeps using the configured window length", async () => {
    const app = buildApp({ max: 1, message, windowMs: 1000 });

    expect((await request(app).get("/read")).status).toBe(200);
    const blocked = await request(app).get("/read");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["ratelimit-policy"]).toBe("1;w=1");
  });
});

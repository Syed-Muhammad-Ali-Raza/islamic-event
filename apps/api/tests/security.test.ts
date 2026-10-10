import { api, unique, registerUser } from "./helpers";
import { prisma } from "../src/config/prisma";
import bcrypt from "bcryptjs";

describe("Security: account lockout", () => {
  it("locks the account after 5 failed login attempts and unlocks after the window", async () => {
    const email = `${unique("lock")}@test.dev`;
    const password = "Password123!";
    await prisma.user.create({
      data: {
        name: "Lock Test",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "USER",
      },
    });

    // 5 failed attempts → locked
    for (let i = 0; i < 5; i++) {
      const fail = await api().post("/api/v1/auth/login").send({ email, password: "WrongPass1!" });
      expect(fail.status).toBe(401);
    }

    // Even the correct password is rejected while locked
    const locked = await api().post("/api/v1/auth/login").send({ email, password });
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe("ACCOUNT_LOCKED");

    // Simulate lock expiry
    await prisma.user.update({
      where: { email },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    const ok = await api().post("/api/v1/auth/login").send({ email, password });
    expect(ok.status).toBe(200);

    // Counters reset after success
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user!.failedLoginAttempts).toBe(0);
    expect(user!.lockedUntil).toBeNull();
  });

  it("does not count failed attempts for unknown emails (no user enumeration lockout)", async () => {
    const email = `${unique("ghost")}@test.dev`;
    for (let i = 0; i < 6; i++) {
      const res = await api().post("/api/v1/auth/login").send({ email, password: "Whatever1!" });
      expect(res.status).toBe(401);
    }
    // Still 401 (not 429) — nothing to lock
    const res = await api().post("/api/v1/auth/login").send({ email, password: "Whatever1!" });
    expect(res.status).toBe(401);
  });
});

describe("Security: origin guard", () => {
  it("rejects state-changing requests from a disallowed Origin", async () => {
    const user = await registerUser("origin");
    const res = await api()
      .post("/api/v1/events")
      .set("Origin", "https://evil.example.com")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ title: "X", date: "2030-01-01", venue: "Y", categoryId: "c" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ORIGIN_REJECTED");
  });

  it("allows state-changing requests with no Origin header (non-browser clients)", async () => {
    const user = await registerUser("noorigin");
    // No Origin header — should pass the guard (may fail later validation, but not 403 ORIGIN_REJECTED)
    const res = await api()
      .post("/api/v1/organizers")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: `Org ${unique("org")}` });
    expect(res.status).not.toBe(403);
    expect(res.body.code).not.toBe("ORIGIN_REJECTED");
  });
});

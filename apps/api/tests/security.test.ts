import { api, unique, registerUser, createSuperAdmin, authHeader } from "./helpers";
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
    // The wait window is machine-readable so the UI can count down.
    expect(typeof locked.body.retryAfter).toBe("number");
    expect(locked.body.retryAfter).toBeGreaterThan(0);
    expect(locked.body.retryAfter).toBeLessThanOrEqual(15 * 60);
    expect(locked.headers["retry-after"]).toBe(String(locked.body.retryAfter));

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
    const admin = await createSuperAdmin("noorigin");
    // No Origin header — should pass the guard (may fail later validation, but not 403 ORIGIN_REJECTED)
    const res = await api()
      .post("/api/v1/organizers")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: `Org ${unique("org")}` });
    expect(res.status).toBe(201);
    expect(res.body.code).not.toBe("ORIGIN_REJECTED");
  });
});

describe("Security: admin-only writes", () => {
  it("blocks non-admins from creating or editing people", async () => {
    const user = await registerUser("peopleuser");
    const name = `Person ${unique("person")}`;

    const create = await api()
      .post("/api/v1/people")
      .set(authHeader(user.token))
      .send({ name });
    expect(create.status).toBe(403);

    const person = await prisma.person.create({ data: { name, slug: unique("personslug") } });
    try {
      const patch = await api()
        .patch(`/api/v1/people/${person.id}`)
        .set(authHeader(user.token))
        .send({ description: "unauthorized edit" });
      expect(patch.status).toBe(403);
    } finally {
      await prisma.person.delete({ where: { id: person.id } });
    }
  });

  it("allows a super admin to create a person", async () => {
    const admin = await createSuperAdmin("peopleadmin");
    const res = await api()
      .post("/api/v1/people")
      .set(authHeader(admin.token))
      .send({ name: `Person ${unique("person")}` });
    expect(res.status).toBe(201);
    await prisma.person.delete({ where: { id: res.body.data.id } });
  });
});

describe("Security: email token hygiene", () => {
  it("never returns verification or reset tokens in auth responses", async () => {
    const user = await registerUser("tokenhygiene");
    const row = await prisma.user.findUnique({ where: { email: user.email } });
    expect(row?.verificationToken).toBeTruthy();

    const me = await api().get("/api/v1/auth/me").set(authHeader(user.token));
    expect(me.body.data.verificationToken).toBeUndefined();

    const forgot = await api().post("/api/v1/auth/forgot-password").send({ email: user.email });
    expect(forgot.status).toBe(200);
    expect(JSON.stringify(forgot.body).toLowerCase()).not.toContain("token");

    const badVerify = await api()
      .post("/api/v1/auth/verify-email")
      .send({ token: "not-a-real-token" });
    expect(badVerify.status).toBe(400);
    expect(badVerify.body.data).toBeUndefined();

    const badReset = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token: "not-a-real-token", password: "NewPass123!" });
    expect(badReset.status).toBe(400);
    expect(badReset.body.data).toBeUndefined();
  });
});

jest.mock("../src/services/email.service");

import { api, registerUser, unique, authHeader } from "./helpers";
import { prisma } from "../src/config/prisma";
import * as emailService from "../src/services/email.service";

const verificationMock = jest.mocked(emailService.sendVerificationEmail);
const resetMock = jest.mocked(emailService.sendPasswordResetEmail);

function lastToken(mock: jest.MockedFunction<(arg: { token: string }) => Promise<void>>): string {
  const calls = mock.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][0].token;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/v1/auth/register", () => {
  it("creates an account and sends a verification email", async () => {
    const email = `${unique("new")}@test.dev`;
    const res = await api().post("/api/v1/auth/register").send({
      name: "New User",
      email,
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.user.emailVerifiedAt).toBeNull();

    expect(verificationMock).toHaveBeenCalledTimes(1);
    expect(verificationMock.mock.calls[0][0].to).toBe(email);
    expect(verificationMock.mock.calls[0][0].token).toEqual(expect.any(String));
  });

  it("rejects a duplicate email with 409", async () => {
    const user = await registerUser("dup");
    const res = await api().post("/api/v1/auth/register").send({
      name: "Duplicate",
      email: user.email,
      password: "Password123!",
    });
    expect(res.status).toBe(409);
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await api().post("/api/v1/auth/register").send({
      name: "X",
      email: "not-an-email",
      password: "short",
    });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with valid credentials", async () => {
    const user = await registerUser("login");
    const res = await api().post("/api/v1/auth/login").send({
      email: user.email,
      password: user.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.id).toBe(user.id);
  });

  it("rejects a wrong password with 401", async () => {
    const user = await registerUser("wrongpw");
    const res = await api().post("/api/v1/auth/login").send({
      email: user.email,
      password: "WrongPassword999!",
    });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await api().post("/api/v1/auth/login").send({
      email: `${unique("ghost")}@test.dev`,
      password: "Password123!",
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me & refresh", () => {
  it("returns the current user with a valid token", async () => {
    const user = await registerUser("me");
    const res = await api().get("/api/v1/auth/me").set(authHeader(user.token));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("rejects a missing or malformed token with 401", async () => {
    expect((await api().get("/api/v1/auth/me")).status).toBe(401);
    expect((await api().get("/api/v1/auth/me").set(authHeader("garbage"))).status).toBe(401);
  });

  it("refreshes tokens with a valid refresh token", async () => {
    const user = await registerUser("refresh");
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: user.password });

    const refreshed = await api()
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: login.body.data.refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("rejects an invalid refresh token with 401", async () => {
    const res = await api().post("/api/v1/auth/refresh").send({ refreshToken: "nope" });
    expect(res.status).toBe(401);
  });
});

describe("Email verification flow", () => {
  it("verifies with the emailed token", async () => {
    const user = await registerUser("verify");
    const token = lastToken(verificationMock as never);

    const res = await api().post("/api/v1/auth/verify-email").send({ token });
    expect(res.status).toBe(200);

    const me = await api().get("/api/v1/auth/me").set(authHeader(user.token));
    expect(me.body.data.emailVerifiedAt).not.toBeNull();
  });

  it("rejects a junk token with 400", async () => {
    const res = await api().post("/api/v1/auth/verify-email").send({ token: "junk-token" });
    expect(res.status).toBe(400);
  });

  it("resends a verification email for an unverified account", async () => {
    const user = await registerUser("resend");
    verificationMock.mockClear();

    const res = await api().post("/api/v1/auth/resend-verification").send({ email: user.email });
    expect(res.status).toBe(200);
    expect(verificationMock).toHaveBeenCalledTimes(1);
  });
});

describe("Password reset flow", () => {
  it("returns a generic message for unknown emails", async () => {
    const res = await api()
      .post("/api/v1/auth/forgot-password")
      .send({ email: `${unique("nobody")}@test.dev` });
    expect(res.status).toBe(200);
    expect(res.body.message.toLowerCase()).toContain("if an account exists");
  });

  it("sends a reset email, resets the password, and invalidates the token", async () => {
    const user = await registerUser("reset");
    const forgot = await api()
      .post("/api/v1/auth/forgot-password")
      .send({ email: user.email });
    expect(forgot.status).toBe(200);

    const token = lastToken(resetMock as never);

    const reset = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "BrandNewPass123!" });
    expect(reset.status).toBe(200);

    const oldLogin = await api()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: user.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await api()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "BrandNewPass123!" });
    expect(newLogin.status).toBe(200);

    const reuse = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "AnotherPass123!" });
    expect(reuse.status).toBe(400);
  });

  it("rejects a junk reset token with 400", async () => {
    const res = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token: "junk", password: "BrandNewPass123!" });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/v1/auth/me (profile settings)", () => {
  it("updates name and phone", async () => {
    const user = await registerUser("update");
    const res = await api()
      .patch("/api/v1/auth/me")
      .set(authHeader(user.token))
      .send({ name: "Updated Name", phone: "+92 300 1234567" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Name");
    expect(res.body.data.phone).toBe("+92 300 1234567");
    expect(res.body.data.passwordHash).toBeUndefined();

    const me = await api().get("/api/v1/auth/me").set(authHeader(user.token));
    expect(me.body.data.name).toBe("Updated Name");
  });

  it("clears the phone when an empty string is sent", async () => {
    const user = await registerUser("clearphone");
    await api()
      .patch("/api/v1/auth/me")
      .set(authHeader(user.token))
      .send({ name: user.name, phone: "+92 300 1234567" });

    const res = await api()
      .patch("/api/v1/auth/me")
      .set(authHeader(user.token))
      .send({ name: user.name, phone: "" });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBeNull();
  });

  it("rejects an invalid payload with 422", async () => {
    const user = await registerUser("update422");
    const res = await api()
      .patch("/api/v1/auth/me")
      .set(authHeader(user.token))
      .send({ name: "X", phone: "not-a-phone" });
    expect(res.status).toBe(422);
  });

  it("rejects a missing token with 401", async () => {
    const res = await api().patch("/api/v1/auth/me").send({ name: "No Token" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/change-password", () => {
  it("changes the password and notifies the user", async () => {
    const user = await registerUser("changepw");
    const res = await api()
      .post("/api/v1/auth/change-password")
      .set(authHeader(user.token))
      .send({ currentPassword: user.password, password: "BrandNewPass123!" });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);

    const oldLogin = await api()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: user.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await api()
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "BrandNewPass123!" });
    expect(newLogin.status).toBe(200);

    const notifications = await api()
      .get("/api/v1/notifications")
      .set(authHeader(user.token));
    const titles = notifications.body.data.map((n: { title: string }) => n.title);
    expect(titles).toContain("Your password was changed");
  });

  it("rejects a wrong current password with 401", async () => {
    const user = await registerUser("wrongcurrent");
    const res = await api()
      .post("/api/v1/auth/change-password")
      .set(authHeader(user.token))
      .send({ currentPassword: "NotTheRealOne1!", password: "BrandNewPass123!" });
    expect(res.status).toBe(401);
  });

  it("rejects a weak new password with 422", async () => {
    const user = await registerUser("weakpw");
    const res = await api()
      .post("/api/v1/auth/change-password")
      .set(authHeader(user.token))
      .send({ currentPassword: user.password, password: "short" });
    expect(res.status).toBe(422);
  });

  it("rejects a missing token with 401", async () => {
    const res = await api()
      .post("/api/v1/auth/change-password")
      .send({ currentPassword: "x", password: "BrandNewPass123!" });
    expect(res.status).toBe(401);
  });
});

describe("Database hygiene", () => {
  it("stores only hashed passwords", async () => {
    const user = await registerUser("hash");
    const row = await prisma.user.findUnique({ where: { email: user.email } });
    expect(row).not.toBeNull();
    expect(row!.passwordHash).not.toBe(user.password);
    expect(row!.passwordHash.startsWith("$2")).toBe(true);
  });
});

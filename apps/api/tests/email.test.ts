import { parseSender } from "../src/services/email.service";

// Brevo is preferred over SMTP when both are configured, and the app must fall
// back to the outbox (no delivery) only when neither is set.
describe("email transport", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it("parses a bare sender address", () => {
    expect(parseSender("no-reply@example.com")).toEqual({ email: "no-reply@example.com" });
  });

  it("parses a display name + address", () => {
    expect(parseSender("Community Events <no-reply@example.com>")).toEqual({
      email: "no-reply@example.com",
      name: "Community Events",
    });
  });

  it("parses a quoted display name", () => {
    expect(parseSender('"Events, PK" <a@b.pk>')).toEqual({ email: "a@b.pk", name: "Events, PK" });
  });

  it("prefers Brevo over SMTP", () => {
    process.env.BREVO_API_KEY = "xkeysib-test";
    process.env.SMTP_HOST = "smtp.example.com";
    jest.resetModules();
    const svc = require("../src/services/email.service") as typeof import("../src/services/email.service");
    expect(svc.emailProvider()).toBe("brevo");
  });

  it("uses SMTP when only SMTP is configured", () => {
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_HOST = "smtp.example.com";
    jest.resetModules();
    const svc = require("../src/services/email.service") as typeof import("../src/services/email.service");
    expect(svc.emailProvider()).toBe("smtp");
  });

  it("falls back to the outbox when nothing is configured", () => {
    delete process.env.BREVO_API_KEY;
    delete process.env.SMTP_HOST;
    jest.resetModules();
    const svc = require("../src/services/email.service") as typeof import("../src/services/email.service");
    expect(svc.emailProvider()).toBe("outbox");
  });
});

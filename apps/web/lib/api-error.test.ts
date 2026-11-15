import { describe, expect, it } from "vitest";
import { formatRetryAfter, isRateLimited, parseApiError } from "./api-error";

const axios429 = (retryAfter?: number) => ({
  response: {
    status: 429,
    data: {
      success: false,
      message: "Too many sign-up attempts. Please try again in 15 minutes.",
      code: "RATE_LIMITED",
      ...(retryAfter === undefined ? {} : { retryAfter }),
    },
    headers: {},
  },
});

describe("parseApiError", () => {
  it("reads the message, code and retryAfter from a throttled response", () => {
    expect(parseApiError(axios429(842), "fallback")).toEqual({
      message: "Too many sign-up attempts. Please try again in 15 minutes.",
      code: "RATE_LIMITED",
      status: 429,
      retryAfter: 842,
    });
  });

  it("falls back to the Retry-After header when the body omits retryAfter", () => {
    const error = {
      response: {
        status: 429,
        data: { message: "Too many requests, please try again later." },
        headers: { "retry-after": "120" },
      },
    };
    expect(parseApiError(error, "fallback").retryAfter).toBe(120);
  });

  it("ignores retryAfter on non-429 responses", () => {
    const error = {
      response: { status: 401, data: { message: "Invalid email or password.", retryAfter: 60 } },
    };
    const parsed = parseApiError(error, "fallback");
    expect(parsed.message).toBe("Invalid email or password.");
    expect(parsed.retryAfter).toBeUndefined();
  });

  it("uses the fallback for plain errors and non-axios values", () => {
    expect(parseApiError(new Error("Network Error"), "Login failed.").message).toBe("Login failed.");
    expect(parseApiError(undefined, "Login failed.").message).toBe("Login failed.");
    expect(parseApiError(null, "Login failed.").status).toBeUndefined();
  });
});

describe("isRateLimited", () => {
  it("detects a 429 and nothing else", () => {
    expect(isRateLimited(axios429(30))).toBe(true);
    expect(isRateLimited({ response: { status: 500 } })).toBe(false);
    expect(isRateLimited(new Error("boom"))).toBe(false);
    expect(isRateLimited(undefined)).toBe(false);
  });
});

describe("formatRetryAfter", () => {
  it("formats under a minute as seconds", () => {
    expect(formatRetryAfter(59)).toBe("59s");
    expect(formatRetryAfter(0.4)).toBe("1s");
  });

  it("formats minutes with zero-padded seconds", () => {
    expect(formatRetryAfter(60)).toBe("1:00");
    expect(formatRetryAfter(167)).toBe("2:47");
    expect(formatRetryAfter(900)).toBe("15:00");
  });

  it("returns an empty string when there is nothing to count down", () => {
    expect(formatRetryAfter(0)).toBe("");
    expect(formatRetryAfter(-5)).toBe("");
    expect(formatRetryAfter(Number.NaN)).toBe("");
  });
});

import { describe, it, expect } from "vitest";
import { buildQuery, sanitizePage } from "./server-api";

describe("sanitizePage", () => {
  it("defaults invalid input to 1", () => {
    expect(sanitizePage(undefined)).toBe(1);
    expect(sanitizePage("")).toBe(1);
    expect(sanitizePage("abc")).toBe(1);
    expect(sanitizePage("0")).toBe(1);
    expect(sanitizePage("-3")).toBe(1);
  });

  it("parses valid page numbers", () => {
    expect(sanitizePage("1")).toBe(1);
    expect(sanitizePage("2")).toBe(2);
    expect(sanitizePage("10")).toBe(10);
    expect(sanitizePage("3x")).toBe(1);
  });
});

describe("buildQuery", () => {
  it("sets only defined non-empty values", () => {
    expect(buildQuery({ q: "lahore", page: 2, limit: 24 })).toBe(
      "q=lahore&page=2&limit=24"
    );
  });

  it("skips empty strings and undefined values", () => {
    expect(buildQuery({ q: "", city: undefined, page: 1 })).toBe("page=1");
    expect(buildQuery({})).toBe("");
  });

  it("URL-encodes special characters", () => {
    expect(buildQuery({ q: "a b&c" })).toBe("q=a+b%26c");
  });
});

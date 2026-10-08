import { describe, it, expect } from "vitest";
import i18n, { LANGUAGES, RTL_LANGUAGES } from "./i18n";

type Tree = { [key: string]: string | Tree };

function flatten(obj: Tree, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null ? flatten(value, path) : [path];
  });
}

function getValue(obj: Tree, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (typeof acc !== "object" || acc === null) return undefined;
    return (acc as Tree)[key];
  }, obj);
}

const codes = LANGUAGES.map((l) => l.code);

describe("i18n resources", () => {
  const bundles = Object.fromEntries(
    codes.map((code) => [code, i18n.getResourceBundle(code, "translation") as Tree])
  );

  it("has an English bundle with keys", () => {
    const keys = flatten(bundles.en);
    expect(keys.length).toBeGreaterThan(0);
  });

  it.each(codes)("%s has exactly the same keys as English", (code) => {
    const enKeys = flatten(bundles.en).sort();
    const langKeys = flatten(bundles[code]).sort();
    expect(langKeys).toEqual(enKeys);
  });

  it.each(codes)("%s has no empty translations", (code) => {
    const empty = flatten(bundles[code]).filter((key) => {
      const value = getValue(bundles[code], key);
      return typeof value !== "string" || value.trim().length === 0;
    });
    expect(empty).toEqual([]);
  });

  it("every non-English value differs from the English source (no leftover English)", () => {
    const untranslated = flatten(bundles.en).filter((key) => {
      const en = getValue(bundles.en, key);
      return codes
        .filter((code) => code !== "en")
        .some((code) => getValue(bundles[code], key) === en);
    });
    expect(untranslated).toEqual([]);
  });
});

describe("language configuration", () => {
  it("exposes all four locales", () => {
    expect(codes.sort()).toEqual(["ar", "en", "hi", "ur"]);
  });

  it("marks exactly Arabic and Urdu as RTL", () => {
    expect([...RTL_LANGUAGES].sort()).toEqual(["ar", "ur"]);
  });

  it("falls back to English", () => {
    const fallback = i18n.options.fallbackLng;
    const list = Array.isArray(fallback) ? fallback : [fallback];
    expect(list).toContain("en");
  });
});

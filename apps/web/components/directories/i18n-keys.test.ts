import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import i18n from "../../lib/i18n";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const FILES = [
  "DastarkhwanExplorer.tsx",
  "ImambargahExplorer.tsx",
  "PlacesExplorer.tsx",
  "DarbarsExplorer.tsx",
];

const KEY_RE = /"(directories|dastarkhwan|imambargahs|places|darbars)\.[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*"/g;

type Tree = { [key: string]: string | Tree };

function resolve(bundle: Tree, dotted: string): unknown {
  return dotted.split(".").reduce<unknown>((acc, key) => {
    if (typeof acc !== "object" || acc === null) return undefined;
    return (acc as Tree)[key];
  }, bundle);
}

describe("directory explorer i18n keys", () => {
  const en = i18n.getResourceBundle("en", "translation") as Tree;

  it("has directory namespaces in the English bundle", () => {
    for (const ns of ["directories", "dastarkhwan", "imambargahs", "places", "darbars"]) {
      expect(resolve(en, ns)).toBeTruthy();
    }
  });

  it.each(FILES)("%s only uses keys that exist", (file) => {
    const src = fs.readFileSync(path.join(HERE, file), "utf8");
    const keys = [...src.matchAll(KEY_RE)].map((m) => m[0].slice(1, -1));
    expect(keys.length).toBeGreaterThan(10);
    const missing = [...new Set(keys)].filter((k) => resolve(en, k) === undefined);
    expect(missing).toEqual([]);
  });

  it.each(FILES)("%s has no leftover hardcoded UI strings", (file) => {
    const src = fs.readFileSync(path.join(HERE, file), "utf8");
    const leftovers = src
      .split("\n")
      .map((line, i) => ({ line, i }))
      .filter(({ line }) =>
        /(>Search<|>Verified<|Not verified|Open in Google Maps|← Previous|Next →|Page \{|All provinces|All cities")/.test(
          line
        )
      )
      .filter(({ line }) => !line.includes("t("))
      .filter(({ line }) => !line.includes("!=="));
    expect(leftovers.map((l) => l.i + 1)).toEqual([]);
  });
});

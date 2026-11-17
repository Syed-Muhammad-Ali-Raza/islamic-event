import { describe, expect, it } from "vitest";
import { extractEventQuery, planAssistantMessage } from "./assistant";

const CITIES = [
  { name: "Lahore", slug: "lahore" },
  { name: "Rahim Yar Khan", slug: "rahim-yar-khan" },
  { name: "Islamabad", slug: "islamabad" },
];

// A fixed Wednesday so date assertions never depend on the day the suite runs.
const NOW = new Date(2026, 10, 18, 10, 0, 0);

describe("planAssistantMessage", () => {
  it("recognises greetings and thanks", () => {
    expect(planAssistantMessage("Assalam-o-Alaikum!", CITIES, NOW).intent).toBe("greeting");
    expect(planAssistantMessage("shukriya", CITIES, NOW).intent).toBe("thanks");
  });

  it("falls back to unknown for unrecognised text", () => {
    expect(planAssistantMessage("what is the weather?", CITIES, NOW).intent).toBe("unknown");
  });

  it("routes registration, RSVP and password questions to the FAQ", () => {
    expect(planAssistantMessage("how do I register?", CITIES, NOW)).toMatchObject({
      intent: "faq",
      faq: "register",
    });
    expect(planAssistantMessage("شرکت کیسے کروں؟", CITIES, NOW)).toMatchObject({
      intent: "faq",
      faq: "rsvp",
    });
    expect(planAssistantMessage(" forgot password ", CITIES, NOW)).toMatchObject({
      intent: "faq",
      faq: "password",
    });
  });

  it("prefers a support answer when a question mentions an event and a city", () => {
    expect(planAssistantMessage("how do I RSVP for the milad in Lahore?", CITIES, NOW)).toMatchObject({
      intent: "faq",
      faq: "rsvp",
    });
  });

  it("recognises event lookups in all four locales", () => {
    for (const text of [
      "upcoming events",
      "اگلی تقریبات",
      "आगामी कार्यक्रम",
      "الفعاليات القادمة",
    ]) {
      expect(planAssistantMessage(text, CITIES, NOW).intent).toBe("events");
    }
  });
});

describe("extractEventQuery", () => {
  it("extracts a city and a keyword", () => {
    expect(extractEventQuery("Find milad events in Lahore", CITIES, NOW)).toEqual({
      search: "milad",
      city: "lahore",
    });
  });

  it("matches a multi-word city and survives punctuation", () => {
    expect(extractEventQuery("events in Rahim Yar Khan?", CITIES, NOW)).toEqual({
      city: "rahim-yar-khan",
    });
  });

  it("maps today and tomorrow to a single-day window", () => {
    expect(extractEventQuery("what is happening today", CITIES, NOW)).toEqual({
      fromDate: "2026-11-18",
      toDate: "2026-11-18",
    });
    expect(extractEventQuery("events tomorrow", CITIES, NOW)).toEqual({
      fromDate: "2026-11-19",
      toDate: "2026-11-19",
    });
  });

  it("maps weekend to Friday through Sunday", () => {
    expect(extractEventQuery("events this weekend", CITIES, NOW)).toEqual({
      fromDate: "2026-11-20",
      toDate: "2026-11-22",
    });
  });

  it("maps next month to a full calendar month", () => {
    expect(extractEventQuery("expo events next month", CITIES, NOW)).toEqual({
      search: "expo",
      fromDate: "2026-12-01",
      toDate: "2026-12-31",
    });
  });

  it("returns an empty filter for a bare events request", () => {
    expect(extractEventQuery("show upcoming events", CITIES, NOW)).toEqual({});
  });

  it("is not an event lookup without a signal", () => {
    expect(extractEventQuery("in Lahore", CITIES, NOW)).not.toBeNull(); // city counts
    expect(extractEventQuery("nothing useful", CITIES, NOW)).toBeNull();
  });
});

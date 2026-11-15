import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import { eventDays } from "./calendar";

const day = (d: Date) => format(d, "yyyy-MM-dd");
const at = (iso: string) => new Date(`${iso}T00:00:00`);

describe("eventDays", () => {
  const gridFrom = at("2026-11-01");
  const gridTo = at("2026-11-30");

  it("returns one day for a single-day event", () => {
    expect(eventDays({ date: "2026-11-19T00:00:00.000Z" }, gridFrom, gridTo).map(day)).toEqual([
      "2026-11-19",
    ]);
  });

  it("returns one day when endDate equals date", () => {
    const days = eventDays(
      { date: "2026-11-19", endDate: "2026-11-19" },
      gridFrom,
      gridTo
    ).map(day);
    expect(days).toEqual(["2026-11-19"]);
  });

  it("returns every day of a multi-day range", () => {
    const days = eventDays(
      { date: "2026-11-19", endDate: "2026-11-21" },
      gridFrom,
      gridTo
    ).map(day);
    expect(days).toEqual(["2026-11-19", "2026-11-20", "2026-11-21"]);
  });

  it("clamps a range that starts before the visible window", () => {
    const days = eventDays(
      { date: "2026-10-28", endDate: "2026-11-02" },
      gridFrom,
      gridTo
    ).map(day);
    expect(days).toEqual(["2026-11-01", "2026-11-02"]);
  });

  it("drops events that do not overlap the window at all", () => {
    expect(
      eventDays({ date: "2026-12-05", endDate: "2026-12-07" }, gridFrom, gridTo)
    ).toEqual([]);
  });
});

import type { Page } from "@playwright/test";
import {
  test,
  expect,
  approveEventViaApi,
  createEventViaApi,
  unique,
} from "./fixtures";

// The calendar is client-rendered and starts on the current month, so the
// events are created in the *next* month and the helper below walks the month
// arrows until the header matches. Dates are built from local parts (not
// `new Date("YYYY-MM-DD")`, which is UTC) so formatting matches the browser
// regardless of the runner's timezone.
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/** Local noon keeps Intl formatting on the intended calendar day in any zone. */
const atNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

const CARD_DAY = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
// Mirrors date-fns `EEEE, dd MMMM yyyy` on the detail page ("Thursday, 10 December 2026").
const LONG_DAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/** Click the month arrows until `#events-calendar` shows the month of `target`. */
async function showMonth(page: Page, target: Date): Promise<void> {
  const heading = page.locator("#events-calendar h2");
  const want = `${target.getFullYear()}-${target.getMonth()}`;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const label = (await heading.innerText()).trim(); // e.g. "December 2026"
    const shown = new Date(`${label.replace(" ", " 1, ")} 12:00:00`);
    if (`${shown.getFullYear()}-${shown.getMonth()}` === want) return;

    await page
      .locator(shown < target ? "#calendar-next" : "#calendar-prev")
      .click();
    await expect(heading).not.toHaveText(label); // wait for the re-render
  }

  throw new Error(
    `calendar never reached ${want}; header reads "${await heading.innerText()}"`
  );
}

test.describe("Calendar month view", () => {
  // `next dev` compiles /events and /events/[slug] on first hit, which can take
  // well over the default navigation budget; registering also sends an email
  // (slow when a real SMTP server is configured locally). Both are one-off
  // costs, so this spec gets a wider budget than the rest of the suite.
  test.use({ navigationTimeout: 45_000 });
  test.describe.configure({ timeout: 120_000 });

  test("a multi-day event fills every day it runs and shows its range", async ({
    page,
    request,
    auth,
  }) => {
    const marker = unique("mdcal"); // URL-safe, unique per run
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const day = (n: number) => new Date(month.getFullYear(), month.getMonth(), n);

    const multi = await createEventViaApi(request, auth, {
      title: `Calendar ${marker} multi`,
      date: iso(day(10)),
      endDate: iso(day(12)),
    });
    const single = await createEventViaApi(request, auth, {
      title: `Calendar ${marker} single`,
      date: iso(day(20)),
    });
    await approveEventViaApi(request, multi.id);
    await approveEventViaApi(request, single.id);

    await test.step("the list card shows the range, not a single day", async () => {
      // The search filter keeps the month's cells free of seed data, so counts
      // below are exact.
      await page.goto(`/events?search=${marker}`);

      const range = `${CARD_DAY.format(atNoon(day(10)))} – ${CARD_DAY.format(
        atNoon(day(12))
      )} ${day(12).getFullYear()}`;
      await expect(page.getByText(range)).toBeVisible();
      await expect(page.getByText(single.title)).toBeVisible();
    });

    await test.step("the calendar paints every day of the run", async () => {
      await page.locator("#events-view-calendar").click();
      await expect(page.locator("#events-calendar")).toBeVisible();
      await showMonth(page, month);

      const calendar = page.locator("#events-calendar");

      for (const n of [10, 11, 12]) {
        await expect(
          calendar.locator(`[data-date="${iso(day(n))}"]`).getByTitle(multi.title)
        ).toBeVisible();
      }
      // Exactly three cells — a 3-day run must not leak into the days around it.
      await expect(calendar.getByTitle(multi.title)).toHaveCount(3);
      await expect(
        calendar.locator(`[data-date="${iso(day(9))}"]`).getByTitle(multi.title)
      ).toHaveCount(0);
      await expect(
        calendar.locator(`[data-date="${iso(day(13))}"]`).getByTitle(multi.title)
      ).toHaveCount(0);

      // A single-day event stays on its own cell.
      await expect(calendar.getByTitle(single.title)).toHaveCount(1);
      await expect(
        calendar.locator(`[data-date="${iso(day(20))}"]`).getByTitle(single.title)
      ).toBeVisible();
    });

    await test.step("the detail page names the range and the structured data", async () => {
      await page.goto(`/events/${multi.slug}`);

      await expect(page.getByText("Event dates")).toBeVisible();
      await expect(
        page.getByText(
          `${LONG_DAY.format(atNoon(day(10)))} – ${LONG_DAY.format(atNoon(day(12)))}`
        )
      ).toBeVisible();

      const blocks = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      const eventBlock = blocks.find((text) => text.includes('"Event"'));
      expect(eventBlock).toBeTruthy();
      expect(eventBlock).toContain(iso(day(10)));
      expect(eventBlock).toContain(iso(day(12)));
    });
  });
});

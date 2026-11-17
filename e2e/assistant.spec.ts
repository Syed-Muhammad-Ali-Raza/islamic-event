import { test, expect } from "./fixtures";

test.describe("Community Assistant", () => {
  test("answers FAQs, finds events from cache and follows the site locale", async ({ page }) => {
    const eventRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/events?")) eventRequests.push(request.url());
    });

    // The assistant needs the cached city list to turn "Lahore" into a slug.
    const citiesLoaded = page.waitForResponse(
      (response) => response.url().includes("/api/v1/cities") && response.status() === 200
    );
    await page.goto("/");
    await citiesLoaded;

    const toggle = page.getByTestId("assistant-toggle");
    const panel = page.getByTestId("assistant-panel");
    const input = page.getByTestId("assistant-input");
    const messages = page.getByTestId("assistant-message");
    const cards = page.getByTestId("assistant-event-card");

    await test.step("opens as a floating widget and answers a FAQ", async () => {
      await expect(panel).toBeHidden();
      await toggle.click();
      await expect(panel).toBeVisible();
      await expect(messages.first()).toContainText(/find events/i);

      await page.getByTestId("assistant-quick-reply").filter({ hasText: /register/i }).click();
      await expect(messages.filter({ hasText: /registration is free/i })).toBeVisible();
      await expect(panel.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
    });

    await test.step("finds events and reuses the cached answer", async () => {
      await page.getByTestId("assistant-reset").click();
      await expect(page.getByTestId("assistant-quick-reply").first()).toBeVisible();

      const ask = async () => {
        await input.fill("events in Lahore");
        await page.getByTestId("assistant-send").click();
        await expect(cards.first()).toBeVisible({ timeout: 20_000 });
      };

      await ask();
      await expect.poll(() => eventRequests.length, { timeout: 5_000 }).toBeGreaterThan(0);
      const afterFirst = eventRequests.length;
      await expect(cards.first()).toContainText(/Lahore|Expo|Fair|Book/i);

      await page.getByTestId("assistant-reset").click();
      await ask();
      // The identical filters are a React Query cache hit: no second request.
      expect(eventRequests).toHaveLength(afterFirst);
    });

    await test.step("event cards link to the event detail", async () => {
      const href = await cards.first().getAttribute("href");
      expect(href).toMatch(/^\/events\//);
      await cards.first().click();
      await expect(page).toHaveURL(new RegExp(href!));
      await expect(panel).toBeHidden();
    });

    await test.step("follows the selected locale and RTL direction", async () => {
      await page.evaluate(() => localStorage.setItem("ce-lang", "ur"));
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await page.getByTestId("assistant-toggle").click();
      await expect(page.getByTestId("assistant-panel")).toContainText("کمیونٹی اسسٹنٹ");
      await expect(page.getByTestId("assistant-input")).toHaveAttribute(
        "placeholder",
        /تقریبات/
      );
    });
  });
});

import { test, expect } from "./fixtures";

test.describe("Events", () => {
  test("events page loads with search box", async ({ page }) => {
    await page.goto("/events");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#events-search")).toBeVisible();
    await expect(page.locator("#events-search-apply")).toBeVisible();
  });

  test("search updates the URL query", async ({ page }) => {
    await page.goto("/events");

    await page.locator("#events-search").fill("Milad");
    await page.locator("#events-search-apply").click();

    await expect(page).toHaveURL(/search=Milad/);
    // List area still renders (may be empty depending on seed)
    await expect(page.locator("#events-search")).toHaveValue("Milad");
  });
});

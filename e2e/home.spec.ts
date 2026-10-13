import { test, expect } from "./fixtures";

test.describe("Home", () => {
  test("loads with hero, nav and curated directories", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Community/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Navbar Events link (scoped to main nav to avoid footer matches)
    await expect(
      page.getByRole("navigation", { name: "Main Navigation" }).getByRole("link", { name: "Events", exact: true })
    ).toBeVisible();

    // Curated Community Registers section with Scholars + Darbars cards
    await expect(page.getByRole("heading", { name: /Curated Community Registers/i })).toBeVisible();
    await expect(page.locator('a[href="/scholars"]').first()).toBeVisible();
    await expect(page.locator('a[href="/darbars"]').first()).toBeVisible();
  });
});

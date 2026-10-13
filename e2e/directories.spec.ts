import { test, expect } from "./fixtures";

test.describe("Directories", () => {
  test("scholars page renders title, filters and cards", async ({ page }) => {
    await page.goto("/scholars");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Islamic Scholars/i);
    // Disclaimer is present
    await expect(page.getByText(/verify with primary sources/i)).toBeVisible();
    // At least one scholar card rendered (seed has 96)
    await expect(page.locator(".group-hover\\:text-brand-700").first()).toBeVisible();
  });

  test("scholars sect filter narrows results via URL", async ({ page }) => {
    await page.goto("/scholars?sect=SHIA");

    // Active sect chip is selected (SHIA button has brand-600 bg)
    await expect(page).toHaveURL(/sect=SHIA/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Islamic Scholars/i);
    await expect(page.locator(".group-hover\\:text-brand-700").first()).toBeVisible();
  });

  test("scholars city filter shows clear-city chip and filtered cards", async ({ page }) => {
    await page.goto("/scholars?city=Lahore");

    await expect(page).toHaveURL(/city=Lahore/);
    // Active city chip with clear button (seeded: 4 Lahore scholars)
    await expect(page.getByText("Lahore").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Clear city filter/i })).toBeVisible();
    // 4 Lahore scholars rendered
    await expect(page.locator(".group-hover\\:text-brand-700")).toHaveCount(4);
  });

  test("darbars page renders", async ({ page }) => {
    await page.goto("/darbars");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Darbars/i);
  });
});

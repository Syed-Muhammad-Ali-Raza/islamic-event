import { test, expect } from "./fixtures";

test.describe("Cities", () => {
  test("cities index renders", async ({ page }) => {
    await page.goto("/cities");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Lahore city hub shows events header and scholars Explore row", async ({ page }) => {
    await page.goto("/cities/lahore");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Lahore/i);

    // Explore section includes a Scholars row linking to /scholars?city=Lahore
    const scholarsRow = page.locator('a[href="/scholars?city=Lahore"]');
    await expect(scholarsRow).toBeVisible();
    await expect(scholarsRow).toContainText(/Scholar/i);

    // Hero meta shows scholar count (seeded: 4)
    await expect(page.getByText(/4 scholars in Lahore/)).toBeVisible();
  });
});

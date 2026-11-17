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

  test("hero city picker searches, narrows and selects", async ({ page }) => {
    // Count the type-ahead requests: a 6-character burst must cost at most one
    // request (250 ms debounce), not one per keystroke.
    const searches: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/v1/cities") && url.includes("?q=")) searches.push(url);
    });

    await page.goto("/");

    const input = page.locator("#hero-city");
    const options = page.getByTestId("city-option");

    await input.click();
    await expect(options.first()).toBeVisible();

    // A term that matches nothing closes the loop without any seed dependency.
    await input.pressSequentially("zzzqqq", { delay: 20 });
    await expect(page.getByTestId("city-no-results")).toBeVisible();
    // Six keystrokes, one debounced request (and none for the earlier ones).
    await expect.poll(() => searches.length, { timeout: 5_000 }).toBe(1);

    // Clearing restores the cached list, then a click fills the input.
    await input.fill("");
    await expect(options.first()).toBeVisible();

    const first = options.first();
    const name = (await first.locator("span").first().innerText()).trim();
    const slug = await first.getAttribute("data-slug");
    expect(slug).toBeTruthy();

    await first.click();
    await expect(input).toHaveValue(name);
    await expect(options).toHaveCount(0); // list closes on select

    // The hero form carries the selection into the events list.
    await page.locator("#hero-search-button").click();
    await expect(page).toHaveURL(new RegExp(`/events\\?city=${slug}`));

    // Nothing after the debounce window issued another lookup.
    expect(searches).toHaveLength(1);
  });
});

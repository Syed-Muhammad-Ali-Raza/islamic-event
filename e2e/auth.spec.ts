import { test, expect, unique } from "./fixtures";

test.describe("Auth", () => {
  test("register creates an account and logs the user in", async ({ page }) => {
    const email = `${unique("e2e")}@example.com`;
    const password = "E2ePass@123";

    await page.goto("/register");

    await page.locator("#register-name").fill("E2E Test User");
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.locator("#register-confirm-password").fill(password);
    await page.locator("#register-submit").click();

    // useRegister redirects to "/" on success
    await expect(page).toHaveURL("/");
    // Navbar shows user menu (authenticated)
    await expect(page.locator("#user-menu-button")).toBeVisible();
    // Signed-out CTA (Get Started) is gone from the header area
    await expect(page.locator("header").getByRole("link", { name: "Get Started" })).toHaveCount(0);
  });

  test("logout returns to signed-out state; login works again", async ({ page, request }) => {
    const email = `${unique("e2e")}@example.com`;
    const password = "E2ePass@123";

    const reg = await request.post(
      `${process.env.E2E_API_URL ?? "http://localhost:4000"}/api/v1/auth/register`,
      { data: { name: "E2E Login User", email, password } }
    );
    expect(reg.ok()).toBeTruthy();

    await page.goto("/login");
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.locator("#login-submit").click();

    await expect(page).toHaveURL("/");
    await expect(page.locator("#user-menu-button")).toBeVisible();

    // Logout via user menu
    await page.locator("#user-menu-button").click();
    await page.locator("#logout-button").click();
    await expect(page.locator("#user-menu-button")).toHaveCount(0);
    // Header shows signed-out CTAs again
    await expect(page.locator("header").getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "Get Started" })).toBeVisible();
  });
});

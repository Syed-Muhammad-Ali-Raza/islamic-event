import { test, expect, seedAuth, unique } from "./fixtures";

test.describe("Event create wizard", () => {
  test("authenticated user can complete the 4-step wizard and submit", async ({
    page,
    auth,
  }) => {
    await seedAuth(page, auth);

    await page.goto("/events/create");
    await expect(page.locator("#event-title")).toBeVisible({ timeout: 15_000 });

    const title = `E2E Wizard ${unique("t")}`;
    const currentStep = page.locator('[aria-current="step"]');
    const continueBtn = page.getByRole("button", { name: "Continue" });
    const submitBtn = page.getByRole("button", { name: "Submit for Review" });
    const successHeading = page.getByRole("heading", { name: /Event submitted/i });

    // Step 1 — Basics
    await expect(currentStep).toContainText("Basics");
    await page.locator("#event-title").fill(title);
    await page.locator("#event-description").fill("Created by Playwright E2E");
    const categorySelect = page.locator("#event-category");
    await expect(categorySelect.locator("option")).not.toHaveCount(1, { timeout: 10_000 });
    await categorySelect.selectOption({
      value: (await categorySelect.locator("option").nth(1).getAttribute("value"))!,
    });
    await continueBtn.click();
    await expect(currentStep).toContainText("When & Where");

    // Step 2 — When & Where
    await page.locator("#event-date").fill("2027-03-01");
    await page.locator("#event-venue").fill("E2E Test Hall");
    await continueBtn.click();
    await expect(currentStep).toContainText("Poster");

    // Step 3 — Poster (skip)
    await continueBtn.click();

    // Step 4 — Review → Submit. The Continue→Submit button swap can race
    // the click, so wait for either the submit button or the success screen.
    const reachedSubmit = await submitBtn
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (reachedSubmit) {
      await expect(currentStep).toContainText("Review");
      await expect(page.getByText(title)).toBeVisible();
      await submitBtn.click();
    }

    await expect(successHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("pending review")).toBeVisible();
  });
});

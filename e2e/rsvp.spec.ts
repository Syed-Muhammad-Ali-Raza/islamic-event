import { test, expect, seedAuth, registerViaApi, createEventViaApi, approveEventViaApi } from "./fixtures";

test.describe("RSVP", () => {
  test("authenticated user can open event and RSVP controls are present", async ({
    page,
    request,
  }) => {
    // Create + approve an event so its detail page is public
    const tokens = await registerViaApi(request);
    const event = await createEventViaApi(request, tokens, { title: "E2E RSVP Event" });
    await approveEventViaApi(request, event.id);

    await seedAuth(page, tokens);
    await page.goto(`/events/${event.slug}`);

    // Detail page renders with RSVP controls visible
    await expect(page.locator("#event-rsvp")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#rsvp-interested")).toBeEnabled();
    await expect(page.locator("#rsvp-attending")).toBeEnabled();

    // Clicking Interested keeps us on the page (authenticated — no login redirect)
    await page.locator("#rsvp-interested").click();
    await expect(page).toHaveURL(new RegExp(`/events/${event.slug}`));
    // Button remains present after the mutation settles
    await expect(page.locator("#rsvp-interested")).toBeVisible({ timeout: 10_000 });
  });
});

import {
  test,
  expect,
  unique,
  registerViaApi,
  seedAuth,
  createOrgViaApi,
  addMemberViaApi,
} from "./fixtures";

test.describe("Directory approvals", () => {
  test("editor submits a listing, owner approves it from the queue, it goes public", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    // ── Setup: org with an EDITOR (submits) and an OWNER (reviews) ──────────
    const editor = await registerViaApi(request, { name: "E2E Editor" });
    const owner = await registerViaApi(request, { name: "E2E Owner" });
    const org = await createOrgViaApi(request);
    await addMemberViaApi(request, org.id, editor.user.email, "EDITOR");
    await addMemberViaApi(request, org.id, owner.user.email, "OWNER");

    const placeName = `E2E Place ${unique("p")}`;

    // ── Editor submits a place listing through the dashboard form ───────────
    await seedAuth(page, editor);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Submit a listing" }).click();

    await page.locator("#submit-module").selectOption("place");
    await page.locator("#submit-org").selectOption({ label: org.name });
    await page.locator("#sub-name").fill(placeName);
    await page.locator("#sub-category").fill("Shrine");
    await page.locator("#sub-type").fill("Historic");
    await page.locator("#sub-city").fill("Lahore");
    await page.locator("#sub-province").fill("Punjab");
    await page.locator("#sub-address").fill("123 Test Road, Lahore");
    await page.getByRole("button", { name: "Submit for review" }).click();

    await expect(page.getByText(/will appear publicly once approved/i)).toBeVisible();

    // ── It shows up as Pending in the editor's own submissions ──────────────
    await page.getByRole("button", { name: "My submissions" }).click();
    const editorRow = page.getByRole("listitem").filter({ hasText: placeName });
    await expect(editorRow).toBeVisible();
    await expect(editorRow.getByText("Pending")).toBeVisible();

    // ── Negative: EDITOR sees the row in /approvals but cannot decide it ────
    await page.goto("/approvals");
    const editorQueueRow = page.getByRole("listitem").filter({ hasText: placeName });
    await expect(editorQueueRow).toBeVisible();
    await expect(editorQueueRow.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(editorQueueRow.getByRole("button", { name: "Reject" })).toHaveCount(0);

    // ── Owner approves it from the org-scoped queue ─────────────────────────
    await seedAuth(page, owner);
    await page.goto("/approvals");
    const ownerRow = page.getByRole("listitem").filter({ hasText: placeName });
    await expect(ownerRow).toBeVisible();
    await ownerRow.getByRole("button", { name: "Approve" }).click();

    // Leaves the PENDING queue…
    await expect(page.getByRole("listitem").filter({ hasText: placeName })).toHaveCount(0);

    // …and appears under the Approved filter.
    await page.getByLabel("Status").selectOption("Approved");
    const approvedRow = page.getByRole("listitem").filter({ hasText: placeName });
    await expect(approvedRow).toBeVisible();
    await expect(approvedRow.getByText("Approved")).toBeVisible();

    // ── The listing is now public on the directory ──────────────────────────
    await page.goto(`/places?q=${encodeURIComponent(placeName)}`);
    await expect(page.getByText(placeName).first()).toBeVisible();
  });

  test("unauthenticated visitors are gated out of the dashboard and queue", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("non-members never see a submit button on directory pages", async ({ page, request }) => {
    const plainUser = await registerViaApi(request, { name: "E2E Plain" });
    await seedAuth(page, plainUser);
    await page.goto("/places");
    await expect(page.getByRole("link", { name: /Submit for review/i })).toHaveCount(0);
  });
});

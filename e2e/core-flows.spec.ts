import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill("#username", process.env.ADMIN_USERNAME ?? "jamie");
  await page.fill("#password", process.env.ADMIN_PASSWORD ?? "preview-access");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

test.describe("core flows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("open a property from the pipeline and see its facts", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.getByRole("heading", { name: "Property pipeline" })).toBeVisible();

    const firstCard = page.locator('a[href^="/properties/"]').first();
    const propertyName = await firstCard.locator("p").first().textContent();
    await firstCard.click();

    await expect(page).toHaveURL(/\/properties\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Facts" })).toBeVisible();
    if (propertyName) {
      await expect(page.getByRole("heading", { level: 1 })).toContainText(propertyName.trim().slice(0, 8));
    }
  });

  test("compare two properties side by side", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("heading", { name: "Compare properties" })).toBeVisible();

    const checkboxLabels = page.locator("label", { hasText: /./ }).filter({ has: page.locator("button[role=checkbox]") });
    const first = checkboxLabels.first();
    await first.click();
    await page.waitForTimeout(500);
    const second = checkboxLabels.nth(1);
    await second.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("2 / 4 selected")).toBeVisible();
    await expect(page.getByText("Overall rank")).toBeVisible();
  });

  test("propose a viewing and then record a note against it", async ({ page }) => {
    await page.goto("/pipeline");
    await page.locator('a[href^="/properties/"]').first().click();
    await expect(page).toHaveURL(/\/properties\//);

    await page.getByRole("tab", { name: "Viewings" }).click();
    await page.getByRole("button", { name: /add viewing/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/questions to ask/i).fill("Confirm bills, Wi-Fi speed and exact available dates.");
    await dialog.getByRole("button", { name: /save viewing/i }).click();
    await expect(dialog).not.toBeVisible();

    // The newly proposed viewing should now be listed with a "record notes" action.
    await expect(page.getByText("proposed").first()).toBeVisible();
    await page.getByRole("button", { name: /record notes/i }).first().click();

    const notesDialog = page.getByRole("dialog");
    await expect(notesDialog).toBeVisible();
    await notesDialog.getByLabel(/what did you see/i).fill("Bright, quiet, second bedroom works as a study.");
    await notesDialog.getByRole("button", { name: /save notes/i }).click();
    await expect(notesDialog).not.toBeVisible();

    await expect(page.getByText("completed").first()).toBeVisible();
  });
});

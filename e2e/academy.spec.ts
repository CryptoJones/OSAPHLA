import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("visual comfort onboarding and course navigation are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make the course fit your vision." })).toBeVisible();
  await page.getByLabel("High contrast light").check();
  await page.getByRole("button", { name: "Use these settings and enter the academy" }).click();
  await expect(page.getByRole("heading", { name: "Train for useful Spanish, not a streak." })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("link", { name: "Display", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Audio and video media pack" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Install complete media pack" })).toBeVisible();
  await page.getByRole("link", { name: "Course", exact: true }).click();
  await expect(page.getByRole("heading", { name: "36-week course map" })).toBeVisible();
  await page.getByRole("link", { name: /Section 1,/ }).click();
  await expect(page.getByRole("heading", { name: /Briefing: How Spanish Works/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mastery check" })).toBeVisible();
});

test("small-screen reflow retains primary access", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Use these settings and enter the academy" }).click();
  await expect(page.getByRole("link", { name: "Course", exact: true })).toBeVisible();
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= 320)).resolves.toBe(true);
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const themeLabels = [
  "System",
  "High contrast dark",
  "High contrast light",
  "Low glare charcoal",
  "Warm paper",
  "Monochrome"
] as const;

for (const theme of themeLabels) {
  test(`${theme} theme has no detectable accessibility violations`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: theme }).check();
    await page.getByRole("button", { name: "Use these settings and enter the academy" }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("250% text remains usable at a 320-pixel viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.locator("label", { hasText: "Text size" }).getByRole("slider").fill("250");
  await page.getByRole("button", { name: "Use these settings and enter the academy" }).click();
  await expect(page.getByRole("link", { name: "Course", exact: true })).toBeVisible();
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= 320)).resolves.toBe(true);
});

test.describe("forced colors", () => {
  test.use({ forcedColors: "active" });
  test("Windows forced-colors mode retains navigation and focus", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Use these settings and enter the academy" }).click();
    await page.getByRole("link", { name: "Course", exact: true }).focus();
    await expect(page.getByRole("link", { name: "Course", exact: true })).toBeFocused();
    await expect(page.locator("body").evaluate((element) => element.scrollWidth <= innerWidth)).resolves.toBe(true);
  });
});

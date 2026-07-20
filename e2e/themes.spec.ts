import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function openSpanishSettings(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Aprender español, Spanish for English speakers" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

const themeLabels = [
  "System",
  "High contrast dark",
  "High contrast light",
  "Low glare charcoal",
  "Warm paper",
  "Monochrome",
  "Midnight blue",
  "Lavender dusk",
  "Ocean daylight",
  "Rose clay",
  "Amber night",
  "Slate daylight",
  "Cream and ink",
  "Forest night",
  "Burgundy night",
  "Cobalt daylight",
  "Soft neutral gray",
  "Black and amber",
  "Deep ocean",
  "Cyberdeck",
  "WCAG navy and coral",
  "WCAG blue and orange dark",
  "WCAG plum and apricot",
  "WCAG violet and cyan dark"
] as const;

for (const theme of themeLabels) {
  test(`${theme} theme has no detectable accessibility violations`, async ({ page }) => {
    await openSpanishSettings(page);
    await page.getByRole("radio", { name: theme }).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("250% text remains usable at a 320-pixel viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openSpanishSettings(page);
  await page.locator("label", { hasText: "Text size" }).getByRole("slider").fill("250");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("link", { name: "Course", exact: true })).toBeVisible();
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= 320)).resolves.toBe(true);
});

test.describe("forced colors", () => {
  test.use({ forcedColors: "active" });
  test("Windows forced-colors mode retains navigation and focus", async ({ page }) => {
    await openSpanishSettings(page);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("link", { name: "Course", exact: true }).focus();
    await expect(page.getByRole("link", { name: "Course", exact: true })).toBeFocused();
    await expect(page.locator("body").evaluate((element) => element.scrollWidth <= innerWidth)).resolves.toBe(true);
  });
});

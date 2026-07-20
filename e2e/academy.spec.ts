import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function beginSpanishCourse(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Aprender español, Spanish for English speakers" }).click();
  await expect(page.getByText("Select your preferred Display Settings, Scroll to the bottom and click 'Save' to start the course.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function saveSpanishSettings(page: Page) {
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Train for useful Spanish, not a streak." })).toBeVisible();
}

test("new learners choose a course and receive native-language settings guidance", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What would you like to learn?" })).toBeVisible();
  await expect(page.getByText("¿Qué te gustaría aprender?")).toBeVisible();
  await expect(page.locator(".course-flags").filter({ hasText: "🇺🇸 🇬🇧" })).toBeVisible();
  await expect(page.locator(".course-flags").filter({ hasText: "🇲🇽 🇪🇸 🇵🇪 🇨🇴 🇦🇷" })).toBeVisible();

  await page.getByRole("link", { name: "Learn English, Inglés para hispanohablantes" }).click();
  await expect(page).toHaveURL(/\/en\/settings\?welcome=1$/);
  await expect(page.getByText("Selecciona tus ajustes de pantalla preferidos, desplázate hasta el final y haz clic en «Guardar» para comenzar el curso.")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Adapta el curso a tu visión." })).toBeVisible();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aprende inglés útil, no una racha." })).toBeVisible();
  await page.getByRole("link", { name: "Curso", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mapa del curso de 36 semanas" })).toBeVisible();
  await page.getByRole("link", { name: /Sección 1,/ }).click();
  await expect(page.getByRole("heading", { name: /Orientación: Cómo funciona el inglés/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comprobación de dominio" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("Spanish course navigation and settings are accessible", async ({ page }) => {
  await beginSpanishCourse(page);
  await page.getByLabel("High contrast light").check();
  await saveSpanishSettings(page);
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

test("small-screen chooser and course reflow retain primary access", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= 320)).resolves.toBe(true);
  await page.getByRole("link", { name: "Aprender español, Spanish for English speakers" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await saveSpanishSettings(page);
  await expect(page.getByRole("link", { name: "Course", exact: true })).toBeVisible();
  await expect(page.locator("body").evaluate((element) => element.scrollWidth <= 320)).resolves.toBe(true);
});

test("reading activities open complete course passages", async ({ page }) => {
  await beginSpanishCourse(page);
  await saveSpanishSettings(page);
  await page.getByRole("link", { name: "Readers" }).click();
  await page.getByRole("button", { name: "Reading activity 1 Main idea", exact: true }).click();
  await expect(page.getByRole("heading", { name: /How Spanish Works: Main idea/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Passage" })).toBeVisible();
  await expect(page.getByText(/English meaning: Ana opens her notebook/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open assigned lesson" })).toHaveAttribute("href", /\/es\/lesson\/w01-input$/);
});

test("assigned reading links stay inside the selected course", async ({ page }) => {
  await beginSpanishCourse(page);
  await saveSpanishSettings(page);
  await page.goto("/OSAPHLA/es/lesson/w01-input");
  const assignment = page.getByRole("link", { name: "Reading activity 1 Main idea" });
  await expect(assignment).toHaveAttribute("href", /\/es\/readers\?activity=reading-01$/);
  await assignment.click();
  await expect(page).toHaveURL(/\/es\/readers\?activity=reading-01$/);
  await expect(page.getByRole("heading", { name: "How Spanish Works: Main idea" })).toBeVisible();
});

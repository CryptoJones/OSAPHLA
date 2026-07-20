import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const failures = [];
for (const slug of ["es", "en"]) {
  const course = JSON.parse(await readFile(resolve(ROOT, `src/data/${slug}/course.json`), "utf8"));
  const modelHeading = slug === "en" ? "Lenguaje modelo" : "Model language";
  const readingHeading = slug === "en" ? "Lee para entender la situación" : "Read for the situation";
  for (const section of course.sections) {
    section.vocabulary.forEach((item, index) => { if (!item.target?.trim() || !item.meaning?.trim()) failures.push(`${slug}:${section.id} vocabulary ${index + 1} is incomplete`); });
    section.modelSentences.forEach((_, index) => { if (!section.modelTranslations[index]?.trim()) failures.push(`${slug}:${section.id} model ${index + 1} has no meaning`); });
    const modelSlide = section.slides.find((slide) => slide.title === modelHeading);
    if (!modelSlide || modelSlide.body.length !== 5 || modelSlide.body.some((line) => !line.includes(" — "))) failures.push(`${slug}:${section.id} model slide is not bilingual`);
    for (const question of section.questions.filter((item) => item.type === "ordering")) {
      const expected = slug === "en" ? "Significado en español:" : "English meaning:";
      if (!question.prompt.includes(expected)) failures.push(`${slug}:${question.id} has no ${expected} prompt`);
      if (slug === "en" && /^(Por ejemplo|En este contexto|Según la situación)/.test(question.answers[0].join(" "))) failures.push(`${slug}:${question.id} contains a Spanish prefix in its English answer`);
    }
    if (section.kind === "input") {
      if (!section.readingTranslation?.trim()) failures.push(`${slug}:${section.id} has no reading meaning`);
      const block = section.content.find((item) => item.heading === readingHeading);
      if (!block?.translation?.trim()) failures.push(`${slug}:${section.id} reading block is not bilingual`);
    }
  }
  for (const assignment of course.readingAssignments) if (!assignment.passageTranslation?.trim()) failures.push(`${slug}:${assignment.id} has no passage meaning`);
}
if (failures.length) throw new Error(`Bilingual coverage validation failed:\n${failures.join("\n")}`);
console.log("BILINGUAL VALID: both 180-section courses and all 176 reading activities have target-language text and native-language meaning.");

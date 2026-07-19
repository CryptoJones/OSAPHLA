import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const course = JSON.parse(await readFile(resolve(import.meta.dirname, "../src/data/course.json"), "utf8"));
const failures = [];
const requireText = (value, location) => { if (typeof value !== "string" || value.trim().length < 2) failures.push(`${location} has no English meaning.`); };

for (const section of course.sections) {
  section.vocabulary.forEach((item, index) => requireText(item.en, `${section.id} vocabulary ${index + 1}`));
  section.modelSentences.forEach((_, index) => requireText(section.modelTranslations[index], `${section.id} model ${index + 1}`));
  const modelBlock = section.content.find((block) => block.heading === "Model set");
  if (modelBlock) requireText(modelBlock.translation, `${section.id} Model set`);
  const modelSlide = section.slides.find((slide) => slide.title === "Model language");
  if (!modelSlide || modelSlide.body.length !== section.modelSentences.length || modelSlide.body.some((line) => !line.includes(" — "))) failures.push(`${section.id} Model language slide is not fully bilingual.`);
  for (const question of section.questions.filter((item) => item.type === "ordering")) {
    if (!question.prompt.includes("English meaning:")) failures.push(`${question.id} prompt has no English meaning.`);
    if (!question.rationale.includes("It means:")) failures.push(`${question.id} feedback has no English meaning.`);
  }
  if (section.kind === "input") {
    requireText(section.readingTranslation, `${section.id} reading`);
    const block = section.content.find((item) => item.heading === "Read for the situation");
    requireText(block?.translation, `${section.id} reading block`);
    const slide = section.slides.find((item) => item.title === "Read for the situation");
    if (!slide || slide.body.length !== 2) failures.push(`${section.id} reading slide is not bilingual.`);
  }
}

for (const assignment of course.readingAssignments) requireText(assignment.passageTranslation, assignment.id);
if (failures.length) throw new Error(`Bilingual coverage validation failed:\n${failures.join("\n")}`);
console.log(`BILINGUAL VALID: ${course.sections.length} sections, ${course.readingAssignments.length} reading activities, and all assessment ordering prompts include English meaning.`);

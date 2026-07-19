import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const ROOT = resolve(import.meta.dirname, "..");
const course = JSON.parse(await readFile(resolve(ROOT, "src/data/course.json"), "utf8"));

const questionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("multipleChoice"), prompt: z.string(), choices: z.array(z.string()).length(4), answer: z.string(), rationale: z.string() }),
  z.object({ id: z.string(), type: z.literal("cloze"), prompt: z.string(), answer: z.string(), accepted: z.array(z.string()).min(1), accentPolicy: z.enum(["warn", "required"]), rationale: z.string() }),
  z.object({ id: z.string(), type: z.literal("ordering"), prompt: z.string(), tokens: z.array(z.string()).min(2), answers: z.array(z.array(z.string()).min(2)).min(1), rationale: z.string() })
]);

const sectionSchema = z.object({
  id: z.string(), number: z.number().int(), week: z.number().int().min(1).max(36), day: z.number().int().min(1).max(5),
  title: z.string(), objectives: z.array(z.string()).min(3), content: z.array(z.object({ heading: z.string(), body: z.string() })).min(4),
  vocabulary: z.array(z.object({ es: z.string(), en: z.string() })).min(8), slides: z.array(z.object({ title: z.string(), body: z.array(z.string()) })).min(6),
  modelSentences: z.array(z.string()).length(5), modelTranslations: z.array(z.string()).length(5),
  media: z.object({ adaptive: z.literal(true), captions: z.string(), transcript: z.string().min(100) }),
  readingAssignments: z.array(z.object({ id: z.string(), label: z.string() })), questions: z.array(questionSchema).length(24), masteryThreshold: z.literal(0.85)
});

const readingAssignmentSchema = z.object({ id: z.string(), label: z.string(), title: z.string(), week: z.number().int().min(1).max(36), sectionId: z.string(), passage: z.string().min(40), passageTranslation: z.string().min(40), focus: z.string(), instructions: z.string().min(40), prompts: z.array(z.string()).length(3) });
z.object({ schemaVersion: z.literal(1), modules: z.array(z.unknown()).length(36), sections: z.array(sectionSchema).length(180), readingAssignments: z.array(readingAssignmentSchema).length(88) }).parse(course);

for (const section of course.sections) {
  for (const type of ["multipleChoice", "cloze", "ordering"]) {
    const count = section.questions.filter((question) => question.type === type).length;
    if (count !== 8) throw new Error(`${section.id} has ${count} ${type} questions; expected 8`);
  }
}

console.log(`VALID: ${course.sections.length} sections, ${course.sections.length * 24} questions, ${course.readingAssignments.length} reading assignments.`);

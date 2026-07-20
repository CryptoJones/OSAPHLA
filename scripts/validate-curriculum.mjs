import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const ROOT = resolve(import.meta.dirname, "..");
const requested = process.argv.includes("--course") ? process.argv[process.argv.indexOf("--course") + 1] : "all";
if (!["es", "en", "all"].includes(requested)) throw new Error(`Unknown course: ${requested}`);
const slugs = requested === "all" ? ["es", "en"] : [requested];

const questionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("multipleChoice"), prompt: z.string(), choices: z.array(z.string()).length(4), answer: z.string(), rationale: z.string() }),
  z.object({ id: z.string(), type: z.literal("cloze"), prompt: z.string(), answer: z.string(), accepted: z.array(z.string()).min(1), accentPolicy: z.enum(["warn", "required", "english"]), rationale: z.string() }),
  z.object({ id: z.string(), type: z.literal("ordering"), prompt: z.string(), tokens: z.array(z.string()).min(2), answers: z.array(z.array(z.string()).min(2)).min(1), rationale: z.string() })
]);
const readingSchema = z.object({ id: z.string(), label: z.string(), title: z.string(), week: z.number().int().min(1).max(36), sectionId: z.string(), passage: z.string().min(40), passageTranslation: z.string().min(40), focus: z.string(), instructions: z.string().min(40), prompts: z.array(z.string()).length(3) });
const sectionSchema = z.object({
  id: z.string(), number: z.number().int(), week: z.number().int().min(1).max(36), day: z.number().int().min(1).max(5), title: z.string(), objectives: z.array(z.string()).min(3),
  content: z.array(z.object({ heading: z.string(), body: z.string(), translation: z.string().optional() })).min(4),
  vocabulary: z.array(z.object({ target: z.string(), meaning: z.string() })).length(8), slides: z.array(z.object({ title: z.string(), body: z.array(z.string()) })).min(6),
  modelSentences: z.array(z.string()).length(5), modelTranslations: z.array(z.string()).length(5),
  media: z.object({ adaptive: z.literal(true), audio: z.string(), video: z.string(), captions: z.string(), transcript: z.string().min(100) }),
  readingAssignments: z.array(z.object({ id: z.string(), label: z.string() })), questions: z.array(questionSchema).length(24), masteryThreshold: z.literal(0.85)
});
const courseSchema = z.object({ schemaVersion: z.literal(2), slug: z.enum(["es", "en"]), targetLocale: z.enum(["es-419", "en-US"]), instructionLocale: z.enum(["es-419", "en-US"]), modules: z.array(z.unknown()).length(36), sections: z.array(sectionSchema).length(180), readingAssignments: z.array(readingSchema).length(88) });

for (const slug of slugs) {
  const course = courseSchema.parse(JSON.parse(await readFile(resolve(ROOT, `src/data/${slug}/course.json`), "utf8")));
  if (course.slug !== slug) throw new Error(`${slug} artifact declares slug ${course.slug}`);
  for (const section of course.sections) {
    if (![section.media.audio, section.media.video, section.media.captions].every((path) => path.startsWith(`media/${slug}/`))) throw new Error(`${slug}:${section.id} has a cross-course media path`);
    for (const type of ["multipleChoice", "cloze", "ordering"]) {
      const count = section.questions.filter((question) => question.type === type).length;
      if (count !== 8) throw new Error(`${slug}:${section.id} has ${count} ${type} questions; expected 8`);
    }
  }
  console.log(`VALID ${slug}: ${course.sections.length} sections, ${course.sections.length * 24} questions, ${course.readingAssignments.length} reading assignments.`);
}

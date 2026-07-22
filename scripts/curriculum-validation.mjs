import { z } from "zod";

const questionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("multipleChoice"), prompt: z.string(), choices: z.array(z.string()).length(4), answer: z.string(), rationale: z.string() }),
  z.object({ id: z.string(), type: z.literal("cloze"), prompt: z.string(), answer: z.string(), accepted: z.array(z.string()).min(1), accentPolicy: z.enum(["warn", "required", "english"]), rationale: z.string() }),
  z.object({ id: z.string(), type: z.literal("ordering"), prompt: z.string(), tokens: z.array(z.string()).min(2), answers: z.array(z.array(z.string()).min(2)).min(1), rationale: z.string() })
]);
export const readingSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), title: z.string().min(1), week: z.number().int().min(1).max(36), sectionId: z.string().min(1),
  passage: z.string().min(40), passageTranslation: z.string().min(40), focus: z.string().min(1), instructions: z.string().min(40), prompts: z.array(z.string().min(1)).length(3)
});
const sectionSchema = z.object({
  id: z.string(), number: z.number().int(), week: z.number().int().min(1).max(36), day: z.number().int().min(1).max(5), title: z.string(), objectives: z.array(z.string()).min(3),
  content: z.array(z.object({ heading: z.string(), body: z.string(), translation: z.string().optional() })).min(4),
  vocabulary: z.array(z.object({ target: z.string(), meaning: z.string() })).length(8), slides: z.array(z.object({ title: z.string(), body: z.array(z.string()) })).min(6),
  modelSentences: z.array(z.string()).length(5), modelTranslations: z.array(z.string()).length(5),
  media: z.object({ adaptive: z.literal(true), audio: z.string(), video: z.string(), captions: z.string(), transcript: z.string().min(100) }),
  readingAssignments: z.array(z.object({ id: z.string(), label: z.string() })), questions: z.array(questionSchema).length(24), masteryThreshold: z.literal(0.85)
});
const moduleSchema = z.object({
  week: z.number().int().min(1).max(36), phase: z.string().min(1), level: z.string().min(1), title: z.string().min(1),
  canDo: z.array(z.string().min(1)).length(3), sectionIds: z.array(z.string().min(1)).length(5), readingAssignments: z.array(readingSchema).min(1)
});
export const courseSchema = z.object({
  schemaVersion: z.literal(2), slug: z.enum(["es", "en"]), targetLocale: z.enum(["es-419", "en-US"]), instructionLocale: z.enum(["es-419", "en-US"]),
  modules: z.array(moduleSchema).length(36), sections: z.array(sectionSchema).length(180), readingAssignments: z.array(readingSchema).length(88)
});

export function validateCourse(raw, slug) {
  const course = courseSchema.parse(raw);
  if (course.slug !== slug) throw new Error(`${slug} artifact declares slug ${course.slug}`);
  const sections = new Map(course.sections.map((section) => [section.id, section]));
  const globalReadings = new Map(course.readingAssignments.map((assignment) => [assignment.id, assignment]));

  course.modules.forEach((module, index) => {
    const expectedWeek = index + 1;
    if (module.week !== expectedWeek) throw new Error(`${slug} module index ${index} declares week ${module.week}; expected week ${expectedWeek}`);
    if (new Set(module.sectionIds).size !== module.sectionIds.length) throw new Error(`${slug}:week ${module.week} contains duplicate section IDs`);
    for (const sectionId of module.sectionIds) {
      const section = sections.get(sectionId);
      if (!section) throw new Error(`${slug}:week ${module.week} references missing section ${sectionId}`);
      if (section.week !== module.week) throw new Error(`${slug}:week ${module.week} references ${sectionId} from week ${section.week}`);
    }
    for (const assignment of module.readingAssignments) {
      if (assignment.week !== module.week) throw new Error(`${slug}:week ${module.week} contains reading ${assignment.id} from week ${assignment.week}`);
      if (!module.sectionIds.includes(assignment.sectionId)) throw new Error(`${slug}:week ${module.week} reading ${assignment.id} references a section outside its module`);
      if (!globalReadings.has(assignment.id)) throw new Error(`${slug}:week ${module.week} references missing reading ${assignment.id}`);
    }
  });

  for (const section of course.sections) {
    if (![section.media.audio, section.media.video, section.media.captions].every((path) => path.startsWith(`media/${slug}/`))) throw new Error(`${slug}:${section.id} has a cross-course media path`);
    for (const type of ["multipleChoice", "cloze", "ordering"]) {
      const count = section.questions.filter((question) => question.type === type).length;
      if (count !== 8) throw new Error(`${slug}:${section.id} has ${count} ${type} questions; expected 8`);
    }
  }
  return course;
}

import { describe, expect, it } from "vitest";
import spanishJson from "../src/data/es/course.json";
import englishJson from "../src/data/en/course.json";
import type { Course } from "../src/types";

const courses = [spanishJson as Course, englishJson as Course];

describe.each(courses.map((course) => [course.slug, course] as const))("complete %s curriculum", (_slug, course) => {
  it("contains the promised 36 weeks and 180 sections", () => {
    expect(course.schemaVersion).toBe(2);
    expect(course.modules).toHaveLength(36);
    expect(course.sections).toHaveLength(180);
  });

  it("places 88 complete, openable reading assignments", () => {
    expect(course.readingAssignments).toHaveLength(88);
    expect(new Set(course.readingAssignments.map((assignment) => assignment.id)).size).toBe(88);
    for (const assignment of course.readingAssignments) {
      expect(assignment.passage.length).toBeGreaterThan(40);
      expect(assignment.passageTranslation.length).toBeGreaterThan(40);
      expect(assignment.prompts).toHaveLength(3);
      expect(course.sections.some((section) => section.id === assignment.sectionId && section.kind === "input")).toBe(true);
    }
  });

  it("gives every section media, bilingual content, and balanced assessment banks", () => {
    for (const section of course.sections) {
      expect(section.media.adaptive).toBe(true);
      expect(section.media.audio).toContain(`/media/${course.slug}/`.replace(/^\//, ""));
      expect(section.media.transcript.length).toBeGreaterThan(100);
      expect(section.content.length).toBeGreaterThanOrEqual(4);
      expect(section.vocabulary).toHaveLength(8);
      expect(section.vocabulary.every((item) => item.target.trim() && item.meaning.trim())).toBe(true);
      expect(section.modelTranslations).toHaveLength(section.modelSentences.length);
      expect(section.questions).toHaveLength(24);
      for (const type of ["multipleChoice", "cloze", "ordering"]) expect(section.questions.filter((question) => question.type === type)).toHaveLength(8);
    }
  });

  it("pairs input passages and model slides with meanings", () => {
    for (const section of course.sections.filter((item) => item.kind === "input")) {
      expect(section.readingTranslation?.length).toBeGreaterThan(40);
      const readingBlock = section.content.find((block) => block.heading === (course.slug === "en" ? "Lee para entender la situación" : "Read for the situation"));
      expect(readingBlock?.translation).toBe(section.readingTranslation);
    }
    for (const section of course.sections) {
      const modelSlide = section.slides.find((slide) => slide.title === (course.slug === "en" ? "Lenguaje modelo" : "Model language"));
      expect(modelSlide?.body).toHaveLength(5);
      expect(modelSlide?.body.every((line) => line.includes(" — "))).toBe(true);
    }
  });
});

it("keeps all section identities isolated by course slug", () => {
  const keys = courses.flatMap((course) => course.sections.map((section) => `${course.slug}:${section.id}`));
  expect(new Set(keys).size).toBe(360);
});

it("declares the requested course languages and flag sets", () => {
  expect(spanishJson).toMatchObject({ targetLocale: "es-419", instructionLocale: "en-US", flags: ["🇲🇽", "🇪🇸", "🇵🇪", "🇨🇴", "🇦🇷"] });
  expect(englishJson).toMatchObject({ targetLocale: "en-US", instructionLocale: "es-419", flags: ["🇺🇸", "🇬🇧"] });
  expect(englishJson.sections.flatMap((section) => section.questions).filter((question) => question.type === "cloze").every((question) => question.accentPolicy === "english")).toBe(true);
  expect(englishJson.sections.flatMap((section) => section.questions).filter((question) => question.type === "ordering").every((question) => !/^(Por ejemplo|En este contexto|Según la situación)/.test(question.answers?.[0]?.join(" ") ?? ""))).toBe(true);
});

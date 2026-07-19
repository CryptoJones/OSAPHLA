import { describe, expect, it } from "vitest";
import course from "../src/data/course.json";

describe("complete curriculum", () => {
  it("contains the promised 36 weeks and 180 sections", () => { expect(course.modules).toHaveLength(36); expect(course.sections).toHaveLength(180); });
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
  it("gives every section media, semantic content, and balanced assessment banks", () => {
    for (const section of course.sections) {
      expect(section.media.adaptive).toBe(true); expect(section.media.transcript.length).toBeGreaterThan(100);
      expect(section.content.length).toBeGreaterThanOrEqual(4); expect(section.questions).toHaveLength(24);
      for (const type of ["multipleChoice","cloze","ordering"]) expect(section.questions.filter((question) => question.type === type)).toHaveLength(8);
    }
  });
  it("includes 'the' when a vocabulary answer requires a definite article", () => {
    for (const section of course.sections) {
      for (const item of section.vocabulary) {
        if (/^(el|la|los|las)\s/i.test(item.es)) expect(item.en.toLowerCase()).toMatch(/^the\s/);
      }
      for (const question of section.questions) {
        if (question.type !== "ordering" && typeof question.answer === "string" && /^(el|la|los|las)\s/i.test(question.answer) && /Spanish expression|Complete in Spanish/i.test(question.prompt)) {
          expect(question.prompt.toLowerCase()).toContain("the ");
        }
      }
    }
  });
  it("pairs every model sentence with an English meaning in lessons and slides", () => {
    for (const section of course.sections) {
      expect(section.modelTranslations).toHaveLength(section.modelSentences.length);
      expect(section.modelTranslations.every((translation) => translation.trim().length > 0)).toBe(true);
      const modelSlide = section.slides.find((slide) => slide.title === "Model language");
      expect(modelSlide?.body.every((line) => line.includes(" — "))).toBe(true);
    }
  });
  it("pairs every input passage with an English meaning in lessons, readers, and slides", () => {
    for (const section of course.sections.filter((item) => item.kind === "input")) {
      expect(section.readingTranslation?.length).toBeGreaterThan(40);
      const readingBlock = section.content.find((block) => block.heading === "Read for the situation");
      expect(readingBlock && "translation" in readingBlock ? readingBlock.translation : undefined).toBe(section.readingTranslation);
      const readingSlide = section.slides.find((slide) => slide.title === "Read for the situation");
      expect(readingSlide?.body).toHaveLength(2);
    }
  });
  it("does not present model or ordering practice without an English meaning", () => {
    for (const section of course.sections) {
      const modelBlock = section.content.find((block) => block.heading === "Model set");
      if (modelBlock) expect(String("translation" in modelBlock ? modelBlock.translation : "").length).toBeGreaterThan(20);
      for (const question of section.questions.filter((item) => item.type === "ordering")) {
        expect(question.prompt).toContain("English meaning:");
        expect(question.rationale).toContain("It means:");
      }
    }
  });
});

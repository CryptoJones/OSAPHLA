import { describe, expect, it } from "vitest";
import course from "../src/data/course.json";

describe("complete curriculum", () => {
  it("contains the promised 36 weeks and 180 sections", () => { expect(course.modules).toHaveLength(36); expect(course.sections).toHaveLength(180); });
  it("places all 88 reader assignments", () => expect(course.readerAssignments).toHaveLength(88));
  it("maps all 31 documents", () => {
    expect(course.sources).toHaveLength(31);
    const mapped = new Set(course.sections.flatMap((section) => section.sourceRefs));
    expect(course.sources.every((source) => mapped.has(source.id))).toBe(true);
  });
  it("gives every section media, semantic content, and balanced assessment banks", () => {
    for (const section of course.sections) {
      expect(section.media.adaptive).toBe(true); expect(section.media.transcript.length).toBeGreaterThan(100);
      expect(section.content.length).toBeGreaterThanOrEqual(4); expect(section.questions).toHaveLength(24);
      for (const type of ["multipleChoice","cloze","ordering"]) expect(section.questions.filter((question) => question.type === type)).toHaveLength(8);
    }
  });
});

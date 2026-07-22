import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateCourse } from "../scripts/curriculum-validation.mjs";

const load = (slug = "es") => JSON.parse(readFileSync(resolve(process.cwd(), `src/data/${slug}/course.json`), "utf8"));

describe("curriculum module validation", () => {
  it.each(["es", "en"])("accepts the generated %s artifact", (slug) => expect(validateCourse(load(slug), slug).modules).toHaveLength(36));

  it("validates every module field", () => {
    const course = load();
    delete course.modules[0].title;
    expect(() => validateCourse(course, "es")).toThrow(/"modules"[\s\S]*"title"/);
  });

  it.each([
    ["duplicate", (course) => { course.modules[1].week = 1; }],
    ["reordered", (course) => { [course.modules[0], course.modules[1]] = [course.modules[1], course.modules[0]]; }],
    ["non-contiguous", (course) => { course.modules[2].week = 4; }]
  ])("rejects %s module weeks", (_label, mutate) => {
    const course = load();
    mutate(course);
    expect(() => validateCourse(course, "es")).toThrow(/expected week/);
  });

  it("rejects missing and cross-week section references", () => {
    const missing = load();
    missing.modules[0].sectionIds[0] = "missing";
    expect(() => validateCourse(missing, "es")).toThrow(/references missing section/);

    const crossWeek = load();
    crossWeek.modules[0].sectionIds[0] = crossWeek.modules[1].sectionIds[0];
    expect(() => validateCourse(crossWeek, "es")).toThrow(/from week 2/);
  });
});

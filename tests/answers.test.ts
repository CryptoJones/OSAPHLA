import { describe, expect, it } from "vitest";
import { isCorrect, normalizeAnswer, selectAssessment } from "../src/lib/answers";
import type { Question } from "../src/types";

const questions: Question[] = [
  ...Array.from({ length: 8 }, (_, index) => ({ id: `m${index}`, type: "multipleChoice" as const, prompt: "p", choices: ["a","b","c","d"], answer: "a", rationale: "r" })),
  ...Array.from({ length: 8 }, (_, index) => ({ id: `c${index}`, type: "cloze" as const, prompt: "p", answer: "canción", accepted: ["canción"], accentPolicy: (index ? "required" : "warn") as "warn" | "required", rationale: "r" })),
  ...Array.from({ length: 8 }, (_, index) => ({ id: `o${index}`, type: "ordering" as const, prompt: "p", tokens: ["Me","gusta","leer","."], answers: [["Me","gusta","leer","."]], rationale: "r" }))
];

describe("answer engine", () => {
  it("normalizes Unicode, case, and whitespace", () => expect(normalizeAnswer("  CANCIÓN  ")).toBe("canción"));
  it("warns but accepts missing accents during early sections", () => expect(isCorrect(questions[8], "cancion")).toEqual({ correct: true, accentWarning: true }));
  it("requires accents when configured", () => expect(isCorrect(questions[9], "cancion").correct).toBe(false));
  it("requires the complete ordering", () => {
    expect(isCorrect(questions[16], ["Me","gusta","leer","."]).correct).toBe(true);
    expect(isCorrect(questions[16], ["Me","leer","gusta","."]).correct).toBe(false);
  });
  it("serves exactly four questions of each type", () => {
    const selected = selectAssessment(questions, 42);
    expect(selected).toHaveLength(12);
    expect(Object.fromEntries(["multipleChoice","cloze","ordering"].map((type) => [type, selected.filter((question) => question.type === type).length]))).toEqual({ multipleChoice: 4, cloze: 4, ordering: 4 });
  });
});

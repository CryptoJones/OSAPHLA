import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Assessment } from "../src/components/Assessment";
import { CourseProvider } from "../src/course";
import { db } from "../src/lib/db";
import type { Course, MultipleChoiceQuestion, Section } from "../src/types";

const questions: MultipleChoiceQuestion[] = [1, 2, 3, 4].map((number) => ({
  id: `q${number}`, type: "multipleChoice", prompt: `Question ${number}`, rationale: "Because.",
  choices: [`right-${number}`, `wrong-${number}`], answer: `right-${number}`
}));

const section: Section = {
  id: "w01-test", number: 1, week: 1, day: 1, phase: "Foundations", level: "A1", kind: "core",
  title: "Test section", subtitle: "", objectives: [], grammar: "", pronunciation: "",
  content: [], vocabulary: [], modelSentences: [], modelTranslations: [],
  readingAssignments: [], slides: [],
  media: { adaptive: true, audio: "", video: "", captions: "", transcript: "" },
  questions, masteryThreshold: 0.75, estimatedMinutes: 5
};

const course: Course = {
  schemaVersion: 2, slug: "en", id: "en", title: "Test course", subtitle: "", description: "",
  targetLocale: "en-US", instructionLocale: "en-US", flags: [], target: "",
  disclaimer: "", modules: [], sections: [section], readingAssignments: []
};

function progressKey() { return "en:w01-test"; }

describe("assessment auto-save on mastery", () => {
  beforeEach(async () => {
    await Promise.all([db.courseProgress.clear(), db.courseAttempts.clear()]);
  });
  afterEach(cleanup);

  it("persists mastery automatically the moment a live correction crosses the threshold, without another submit click", async () => {
    const onComplete = vi.fn();
    render(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={section} onComplete={onComplete} /></CourseProvider></MemoryRouter>);

    // Answer 2/4 correct, 2/4 wrong: 50% < 75% mastery threshold.
    fireEvent.click(screen.getByRole("radio", { name: "right-1" }));
    fireEvent.click(screen.getByRole("radio", { name: "wrong-2" }));
    fireEvent.click(screen.getByRole("radio", { name: "wrong-3" }));
    fireEvent.click(screen.getByRole("radio", { name: "right-4" }));
    fireEvent.click(screen.getByRole("button", { name: "Score this attempt" }));

    await waitFor(async () => expect(await db.courseProgress.get(progressKey())).toMatchObject({ status: "in-progress" }));
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Fix one wrong answer (no explicit re-submit click) to reach 3/4 = 75%.
    fireEvent.click(screen.getByRole("radio", { name: "right-2" }));

    await waitFor(async () => expect(await db.courseProgress.get(progressKey())).toMatchObject({ status: "mastered", bestScore: 0.75 }));
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("does not persist a duplicate attempt once mastery is already saved", async () => {
    const onComplete = vi.fn();
    render(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={section} onComplete={onComplete} /></CourseProvider></MemoryRouter>);

    fireEvent.click(screen.getByRole("radio", { name: "right-1" }));
    fireEvent.click(screen.getByRole("radio", { name: "right-2" }));
    fireEvent.click(screen.getByRole("radio", { name: "right-3" }));
    fireEvent.click(screen.getByRole("radio", { name: "wrong-4" }));
    fireEvent.click(screen.getByRole("button", { name: "Score this attempt" }));

    await waitFor(async () => expect(await db.courseProgress.get(progressKey())).toMatchObject({ status: "mastered", attempts: 1 }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await db.courseAttempts.count()).toBe(1);

    // Re-render tick without any further crossing shouldn't add another attempt.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(await db.courseAttempts.count()).toBe(1);
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Assessment } from "../src/components/Assessment";
import { CourseProvider } from "../src/course";
import { db, recordAttempt } from "../src/lib/db";
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

const otherQuestions: MultipleChoiceQuestion[] = [1, 2, 3, 4].map((number) => ({
  id: `o${number}`, type: "multipleChoice", prompt: `Other question ${number}`, rationale: "Because.",
  choices: [`right-${number}`, `wrong-${number}`], answer: `right-${number}`
}));

const otherSection: Section = { ...section, id: "w02-test", number: 2, title: "Other test section", questions: otherQuestions };

const course: Course = {
  schemaVersion: 2, slug: "en", id: "en", title: "Test course", subtitle: "", description: "",
  targetLocale: "en-US", instructionLocale: "en-US", flags: [], target: "",
  disclaimer: "", modules: [], sections: [section, otherSection], readingAssignments: []
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

describe("returning to a previously scored lesson", () => {
  beforeEach(async () => {
    await Promise.all([db.courseProgress.clear(), db.courseAttempts.clear()]);
  });
  afterEach(cleanup);

  it("repopulates the questions with the previous attempt's submitted answers instead of grading a blank set", async () => {
    const priorAnswers = { q1: "right-1", q2: "wrong-2", q3: "wrong-3", q4: "right-4" };
    await recordAttempt({ courseSlug: "en", sectionId: section.id, startedAt: "2026-07-01T00:00:00.000Z", completedAt: "2026-07-01T00:05:00.000Z", score: 0.5, questionIds: questions.map((question) => question.id), answers: priorAnswers }, section.masteryThreshold);

    render(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={section} onComplete={vi.fn()} /></CourseProvider></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole("radio", { name: "right-1" })).toBeChecked());
    expect(screen.getByRole("radio", { name: "wrong-2" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "wrong-3" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "right-4" })).toBeChecked();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("Correct.")).toHaveLength(2);
    expect(screen.getAllByText("Repair this.")).toHaveLength(2);
  });

  it("starts a fresh, blank attempt when the section has never been scored", async () => {
    render(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={section} onComplete={vi.fn()} /></CourseProvider></MemoryRouter>);

    expect(await screen.findByText("0/4")).toBeInTheDocument();
    for (const question of questions) expect(screen.getByRole("radio", { name: question.answer })).not.toBeChecked();
  });

  it("resets state per section so a previous section's graded answers don't leak onto the next one", async () => {
    await recordAttempt({ courseSlug: "en", sectionId: section.id, startedAt: "2026-07-01T00:00:00.000Z", completedAt: "2026-07-01T00:05:00.000Z", score: 1, questionIds: questions.map((question) => question.id), answers: { q1: "right-1", q2: "right-2", q3: "right-3", q4: "right-4" } }, section.masteryThreshold);

    const { rerender } = render(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={section} onComplete={vi.fn()} /></CourseProvider></MemoryRouter>);
    expect(await screen.findByText("100%")).toBeInTheDocument();

    // The lesson page reuses this same Assessment instance across "Continue to next
    // section", so simulate that with a prop swap rather than an unmount/remount.
    rerender(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={otherSection} onComplete={vi.fn()} /></CourseProvider></MemoryRouter>);

    expect(await screen.findByText("0/4")).toBeInTheDocument();
    for (const question of otherQuestions) expect(screen.getByRole("radio", { name: question.answer })).not.toBeChecked();
  });

  it("falls back to a fresh attempt when the previous attempt's questions no longer exist in the curriculum", async () => {
    await recordAttempt({ courseSlug: "en", sectionId: section.id, startedAt: "2026-07-01T00:00:00.000Z", completedAt: "2026-07-01T00:05:00.000Z", score: 0.5, questionIds: ["q1", "q-removed", "q3", "q4"], answers: { q1: "right-1", "q-removed": "x", q3: "wrong-3", q4: "right-4" } }, section.masteryThreshold);

    render(<MemoryRouter><CourseProvider course={course}><Assessment course={course} section={section} onComplete={vi.fn()} /></CourseProvider></MemoryRouter>);

    expect(await screen.findByText("0/4")).toBeInTheDocument();
    expect(screen.queryByText(/50%/)).not.toBeInTheDocument();
  });
});

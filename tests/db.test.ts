import { beforeEach, describe, expect, it } from "vitest";
import { courseProgress, db, defaultSettings, importLearningData, recordAttempt } from "../src/lib/db";

const exportedAt = "2026-01-10T00:00:00.000Z";
const currentBackup = () => ({
  schemaVersion: 2 as const,
  exportedAt,
  settings: [{ key: "accessibility", value: { ...defaultSettings } }],
  progress: [{ key: "en:w02-input", courseSlug: "en", sectionId: "w02-input", status: "mastered", bestScore: 0.92, attempts: 1, updatedAt: "2026-01-02T00:00:00.000Z" }],
  attempts: [{ id: 7, courseSlug: "en", sectionId: "w02-input", startedAt: "2026-01-02T00:00:00.000Z", completedAt: "2026-01-02T00:10:00.000Z", score: 0.92, questionIds: ["q1"], answers: { q1: ["the", "answer"] } }],
  reviews: [{ key: "en:v1", id: "v1", courseSlug: "en", sectionId: "w02-input", prompt: "hello", answer: "hola", intervalDays: 1, ease: 2.5, repetitions: 0, dueAt: "2026-01-03T00:00:00.000Z" }]
});

async function snapshot() {
  return {
    settings: await db.settings.toArray(), progress: await db.courseProgress.toArray(),
    attempts: await db.courseAttempts.toArray(), reviews: await db.courseReviews.toArray()
  };
}

beforeEach(async () => {
  await Promise.all([
    db.courseProgress.clear(),
    db.courseAttempts.clear(),
    db.courseReviews.clear(),
    db.settings.clear()
  ]);
});

describe("course-isolated learning records", () => {
  it("stores progress for identical section IDs independently", async () => {
    const base = { sectionId: "w01-briefing", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:10:00.000Z", questionIds: ["q1"], answers: { q1: "answer" } };
    await recordAttempt({ ...base, courseSlug: "es", score: 0.9 }, 0.85);
    await recordAttempt({ ...base, courseSlug: "en", score: 0.4 }, 0.85);

    expect((await courseProgress("es"))[0]).toMatchObject({ courseSlug: "es", sectionId: "w01-briefing", status: "mastered", bestScore: 0.9 });
    expect((await courseProgress("en"))[0]).toMatchObject({ courseSlug: "en", sectionId: "w01-briefing", status: "in-progress", bestScore: 0.4 });
  });

  it("imports version-1 backups as Spanish-course records", async () => {
    await importLearningData({
      schemaVersion: 1,
      exportedAt,
      settings: [{ key: "accessibility", value: Object.fromEntries(Object.entries(defaultSettings).filter(([key]) => key !== "selectedCourse")) }],
      progress: [{ sectionId: "w02-input", status: "mastered", bestScore: 0.92, attempts: 1, updatedAt: "2026-01-02T00:00:00.000Z" }],
      attempts: [],
      reviews: []
    });

    expect((await courseProgress("es"))[0]).toMatchObject({ key: "es:w02-input", courseSlug: "es", sectionId: "w02-input" });
    expect(await courseProgress("en")).toEqual([]);
    expect((await db.settings.get("accessibility"))?.value.selectedCourse).toBe("es");
  });

  it("imports complete version-2 backups", async () => {
    await importLearningData(currentBackup());
    expect((await courseProgress("en"))[0]).toMatchObject({ key: "en:w02-input", status: "mastered" });
    expect(await db.courseAttempts.count()).toBe(1);
    expect(await db.courseReviews.get("en:v1")).toMatchObject({ prompt: "hello", repetitions: 0 });
  });

  it.each([
    ["settings", (backup: ReturnType<typeof currentBackup>) => { backup.settings[0].value.textScale = 999; }],
    ["progress", (backup: ReturnType<typeof currentBackup>) => { (backup.progress[0] as { status: string }).status = "corrupt"; }],
    ["attempts", (backup: ReturnType<typeof currentBackup>) => { backup.attempts[0].score = 2; }],
    ["reviews", (backup: ReturnType<typeof currentBackup>) => { backup.reviews[0].dueAt = "not-a-date"; }]
  ])("rejects malformed %s before changing existing data", async (field, corrupt) => {
    await db.settings.put({ key: "accessibility", value: defaultSettings });
    await db.courseProgress.put({ key: "es:existing", courseSlug: "es", sectionId: "existing", status: "in-progress", bestScore: 0.5, attempts: 2, updatedAt: exportedAt });
    await db.courseAttempts.add({ courseSlug: "es", sectionId: "existing", startedAt: exportedAt, completedAt: exportedAt, score: 0.5, questionIds: ["q"], answers: { q: "a" } });
    await db.courseReviews.put({ key: "es:existing", id: "existing", courseSlug: "es", sectionId: "existing", prompt: "p", answer: "a", intervalDays: 1, ease: 2.5, repetitions: 0, dueAt: exportedAt });
    const before = await snapshot();
    const backup = currentBackup();
    corrupt(backup);

    await expect(importLearningData(backup)).rejects.toThrow(new RegExp(`Invalid academy backup at ${field}`));
    expect(await snapshot()).toEqual(before);
  });
});

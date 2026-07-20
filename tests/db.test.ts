import { beforeEach, describe, expect, it } from "vitest";
import { courseProgress, db, importLearningData, recordAttempt } from "../src/lib/db";

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
      settings: [],
      progress: [{ sectionId: "w02-input", status: "mastered", bestScore: 0.92, attempts: 1, updatedAt: "2026-01-02T00:00:00.000Z" }],
      attempts: [],
      reviews: []
    });

    expect((await courseProgress("es"))[0]).toMatchObject({ key: "es:w02-input", courseSlug: "es", sectionId: "w02-input" });
    expect(await courseProgress("en")).toEqual([]);
  });
});

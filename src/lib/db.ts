import Dexie, { type EntityTable } from "dexie";
import type { AccessibilitySettings, Attempt, CourseSlug, ReviewCard, SectionProgress } from "../types";

interface SettingRow { key: "accessibility"; value: AccessibilitySettings }
interface RecordingRow { id?: number; sectionId: string; createdAt: string; blob: Blob; transcript?: string }
interface CourseProgressRow extends SectionProgress { key: string }
interface CourseReviewRow extends ReviewCard { key: string }
interface CourseRecordingRow extends RecordingRow { courseSlug: CourseSlug }

class AcademyDatabase extends Dexie {
  // Version-1 tables remain readable so existing Spanish progress can be migrated safely.
  progress!: EntityTable<SectionProgress, "sectionId">;
  attempts!: EntityTable<Attempt, "id">;
  settings!: EntityTable<SettingRow, "key">;
  reviews!: EntityTable<ReviewCard, "id">;
  recordings!: EntityTable<RecordingRow, "id">;
  courseProgress!: EntityTable<CourseProgressRow, "key">;
  courseAttempts!: EntityTable<Attempt, "id">;
  courseReviews!: EntityTable<CourseReviewRow, "key">;
  courseRecordings!: EntityTable<CourseRecordingRow, "id">;

  constructor() {
    // Keep the original database name so existing Spanish learners migrate in place.
    super("espanol-academy");
    this.version(1).stores({
      progress: "&sectionId, status, updatedAt",
      attempts: "++id, sectionId, completedAt",
      settings: "&key",
      reviews: "&id, sectionId, dueAt",
      recordings: "++id, sectionId, createdAt"
    });
    this.version(2).stores({
      progress: "&sectionId, status, updatedAt",
      attempts: "++id, sectionId, completedAt",
      settings: "&key",
      reviews: "&id, sectionId, dueAt",
      recordings: "++id, sectionId, createdAt",
      courseProgress: "&key, courseSlug, sectionId, status, updatedAt",
      courseAttempts: "++id, courseSlug, sectionId, completedAt",
      courseReviews: "&key, courseSlug, sectionId, dueAt",
      courseRecordings: "++id, courseSlug, sectionId, createdAt"
    }).upgrade(async (transaction) => {
      const progress = await transaction.table("progress").toArray() as Array<Omit<SectionProgress, "courseSlug">>;
      const attempts = await transaction.table("attempts").toArray() as Array<Omit<Attempt, "courseSlug">>;
      const reviews = await transaction.table("reviews").toArray() as Array<Omit<ReviewCard, "courseSlug">>;
      const recordings = await transaction.table("recordings").toArray() as RecordingRow[];
      await transaction.table("courseProgress").bulkPut(progress.map((row) => ({ ...row, key: `es:${row.sectionId}`, courseSlug: "es" })));
      await transaction.table("courseAttempts").bulkPut(attempts.map(({ id: _id, ...row }) => ({ ...row, courseSlug: "es" })));
      await transaction.table("courseReviews").bulkPut(reviews.map((row) => ({ ...row, key: `es:${row.id}`, courseSlug: "es" })));
      await transaction.table("courseRecordings").bulkPut(recordings.map(({ id: _id, ...row }) => ({ ...row, courseSlug: "es" })));
    });
  }
}

export const db = new AcademyDatabase();

export const defaultSettings: AccessibilitySettings = {
  selectedCourse: "es",
  theme: "system", font: "hyperlegible", textScale: 110, fontWeight: 500, lineHeight: 1.65,
  letterSpacing: 0.01, wordSpacing: 0.04, readingWidth: 72, density: "comfortable", focusWidth: 4,
  cursor: "standard", reducedMotion: false, hideDecoration: false, onboardingComplete: false
};

export async function loadSettings(): Promise<AccessibilitySettings> {
  return { ...defaultSettings, ...(await db.settings.get("accessibility"))?.value };
}

export async function saveSettings(value: AccessibilitySettings) {
  await db.settings.put({ key: "accessibility", value });
}

const progressKey = (courseSlug: CourseSlug, sectionId: string) => `${courseSlug}:${sectionId}`;

export async function courseProgress(courseSlug: CourseSlug) {
  return db.courseProgress.where("courseSlug").equals(courseSlug).toArray();
}

export async function markStarted(courseSlug: CourseSlug, sectionId: string) {
  const key = progressKey(courseSlug, sectionId);
  const current = await db.courseProgress.get(key);
  if (!current) await db.courseProgress.put({ key, courseSlug, sectionId, status: "in-progress", bestScore: 0, attempts: 0, updatedAt: new Date().toISOString() });
}

export async function recordAttempt(attempt: Attempt, threshold: number) {
  await db.transaction("rw", db.courseAttempts, db.courseProgress, async () => {
    await db.courseAttempts.add(attempt);
    const key = progressKey(attempt.courseSlug, attempt.sectionId);
    const current = await db.courseProgress.get(key);
    const bestScore = Math.max(current?.bestScore ?? 0, attempt.score);
    const mastered = bestScore >= threshold;
    await db.courseProgress.put({
      key,
      courseSlug: attempt.courseSlug,
      sectionId: attempt.sectionId,
      status: mastered ? "mastered" : "in-progress",
      bestScore,
      attempts: (current?.attempts ?? 0) + 1,
      completedAt: mastered ? new Date().toISOString() : current?.completedAt,
      updatedAt: new Date().toISOString()
    });
  });
}

export async function exportLearningData() {
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    settings: await db.settings.toArray(),
    progress: await db.courseProgress.toArray(),
    attempts: await db.courseAttempts.toArray(),
    reviews: await db.courseReviews.toArray()
  };
}

export async function importLearningData(raw: unknown) {
  const input = raw as Record<string, unknown>;
  if (![1, 2].includes(Number(input?.schemaVersion)) || !Array.isArray(input.progress)) throw new Error("Unsupported or invalid academy backup.");
  const legacy = Number(input.schemaVersion) === 1;
  const settings = Array.isArray(input.settings) ? input.settings as SettingRow[] : [];
  const progress = (input.progress as Array<Record<string, unknown>>).map((row) => legacy ? { ...row, key: `es:${row.sectionId}`, courseSlug: "es" } : row) as unknown as CourseProgressRow[];
  const attempts = (Array.isArray(input.attempts) ? input.attempts : []).map((row) => legacy ? { ...(row as object), courseSlug: "es" } : row) as Attempt[];
  const reviews = (Array.isArray(input.reviews) ? input.reviews : []).map((row) => legacy ? { ...(row as Record<string, unknown>), key: `es:${(row as Record<string, unknown>).id}`, courseSlug: "es" } : row) as unknown as CourseReviewRow[];
  await db.transaction("rw", db.settings, db.courseProgress, db.courseAttempts, db.courseReviews, async () => {
    await Promise.all([db.settings.clear(), db.courseProgress.clear(), db.courseAttempts.clear(), db.courseReviews.clear()]);
    await db.settings.bulkPut(settings);
    await db.courseProgress.bulkPut(progress);
    await db.courseAttempts.bulkPut(attempts.map(({ id: _id, ...attempt }) => attempt));
    await db.courseReviews.bulkPut(reviews);
  });
}

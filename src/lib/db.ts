import Dexie, { type EntityTable } from "dexie";
import { z } from "zod";
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

const isoDate = z.string().datetime({ offset: true });
const theme = z.enum(["system", "contrast-dark", "contrast-light", "low-glare", "warm-paper", "monochrome", "midnight-blue", "lavender-dusk", "ocean-light", "rose-clay", "amber-night", "slate-light", "cream-ink", "forest-night", "burgundy-night", "cobalt-light", "soft-gray", "black-amber", "deep-ocean", "cyberdeck", "wcag-navy-coral", "wcag-blue-orange-dark", "wcag-plum-apricot", "wcag-violet-cyan"]);
const legacySettingsValue = z.object({
  theme, font: z.enum(["system", "hyperlegible", "serif", "mono"]), textScale: z.number().min(100).max(250), fontWeight: z.number().min(400).max(800),
  lineHeight: z.number().min(1.3).max(2.2), letterSpacing: z.number().min(0).max(0.15), wordSpacing: z.number().min(0).max(0.3), readingWidth: z.number().min(40).max(90),
  density: z.enum(["comfortable", "compact"]), focusWidth: z.number().min(2).max(8), cursor: z.enum(["standard", "large"]),
  reducedMotion: z.boolean(), hideDecoration: z.boolean(), onboardingComplete: z.boolean()
}).strict();
const settingsValue = legacySettingsValue.extend({ selectedCourse: z.enum(["es", "en"]) });
const legacySettingsRow = z.object({ key: z.literal("accessibility"), value: legacySettingsValue }).strict();
const settingsRow = z.object({ key: z.literal("accessibility"), value: settingsValue }).strict();
const legacyProgressRow = z.object({
  sectionId: z.string().min(1), status: z.enum(["not-started", "in-progress", "mastered"]), bestScore: z.number().min(0).max(1), attempts: z.number().int().nonnegative(),
  completedAt: isoDate.optional(), updatedAt: isoDate
}).strict();
const courseProgressRow = legacyProgressRow.extend({ key: z.string().min(1), courseSlug: z.enum(["es", "en"]) }).superRefine((row, context) => {
  if (row.key !== progressKey(row.courseSlug, row.sectionId)) context.addIssue({ code: "custom", path: ["key"], message: "must match courseSlug and sectionId" });
});
const answerValue = z.union([z.string(), z.array(z.string())]);
const legacyAttempt = z.object({
  id: z.number().int().positive().optional(), sectionId: z.string().min(1), startedAt: isoDate, completedAt: isoDate, score: z.number().min(0).max(1),
  questionIds: z.array(z.string().min(1)), answers: z.record(z.string(), answerValue)
}).strict();
const courseAttempt = legacyAttempt.extend({ courseSlug: z.enum(["es", "en"]) });
const legacyReview = z.object({
  id: z.string().min(1), sectionId: z.string().min(1), prompt: z.string(), answer: z.string(), intervalDays: z.number().int().positive(),
  ease: z.number().min(1.3), repetitions: z.number().int().nonnegative(), dueAt: isoDate
}).strict();
const courseReview = legacyReview.extend({ key: z.string().min(1), courseSlug: z.enum(["es", "en"]) }).superRefine((row, context) => {
  if (row.key !== progressKey(row.courseSlug, row.id)) context.addIssue({ code: "custom", path: ["key"], message: "must match courseSlug and id" });
});
const legacyBackup = z.object({
  schemaVersion: z.literal(1), exportedAt: isoDate, settings: z.array(legacySettingsRow), progress: z.array(legacyProgressRow), attempts: z.array(legacyAttempt), reviews: z.array(legacyReview)
}).strict();
const currentBackup = z.object({
  schemaVersion: z.literal(2), exportedAt: isoDate, settings: z.array(settingsRow), progress: z.array(courseProgressRow), attempts: z.array(courseAttempt), reviews: z.array(courseReview)
}).strict();
const backupSchema = z.discriminatedUnion("schemaVersion", [legacyBackup, currentBackup]);

function invalidBackup(error: z.ZodError) {
  const issue = error.issues[0];
  const path = issue.path.reduce<string>((result, part) => typeof part === "number" ? `${result}[${part}]` : `${result}${result ? "." : ""}${String(part)}`, "") || "backup";
  return new Error(`Invalid academy backup at ${path}: ${issue.message}. Existing learning data was not changed.`);
}

export async function courseProgress(courseSlug: CourseSlug) {
  return db.courseProgress.where("courseSlug").equals(courseSlug).toArray();
}

export async function markStarted(courseSlug: CourseSlug, sectionId: string) {
  const key = progressKey(courseSlug, sectionId);
  const current = await db.courseProgress.get(key);
  if (!current) await db.courseProgress.put({ key, courseSlug, sectionId, status: "in-progress", bestScore: 0, attempts: 0, updatedAt: new Date().toISOString() });
}

export async function latestAttempt(courseSlug: CourseSlug, sectionId: string) {
  const attempts = await db.courseAttempts.where("sectionId").equals(sectionId).and((attempt) => attempt.courseSlug === courseSlug).sortBy("completedAt");
  return attempts.at(-1);
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
  const result = backupSchema.safeParse(raw);
  if (!result.success) throw invalidBackup(result.error);
  const input = result.data;
  const legacy = input.schemaVersion === 1;
  const settings = (legacy
    ? input.settings.map((row) => ({ ...row, value: { selectedCourse: "es" as const, ...row.value } }))
    : input.settings) as SettingRow[];
  const progress = (legacy
    ? input.progress.map((row) => ({ ...row, key: progressKey("es", row.sectionId), courseSlug: "es" as const }))
    : input.progress) as CourseProgressRow[];
  const attempts = (legacy
    ? input.attempts.map((row) => ({ ...row, courseSlug: "es" as const }))
    : input.attempts) as Attempt[];
  const reviews = (legacy
    ? input.reviews.map((row) => ({ ...row, key: progressKey("es", row.id), courseSlug: "es" as const }))
    : input.reviews) as CourseReviewRow[];
  await db.transaction("rw", db.settings, db.courseProgress, db.courseAttempts, db.courseReviews, async () => {
    await Promise.all([db.settings.clear(), db.courseProgress.clear(), db.courseAttempts.clear(), db.courseReviews.clear()]);
    await db.settings.bulkPut(settings);
    await db.courseProgress.bulkPut(progress);
    await db.courseAttempts.bulkPut(attempts.map(({ id: _id, ...attempt }) => attempt));
    await db.courseReviews.bulkPut(reviews);
  });
}

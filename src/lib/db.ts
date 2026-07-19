import Dexie, { type EntityTable } from "dexie";
import type { AccessibilitySettings, Attempt, ReviewCard, SectionProgress } from "../types";

interface SettingRow { key: "accessibility"; value: AccessibilitySettings }
interface RecordingRow { id?: number; sectionId: string; createdAt: string; blob: Blob; transcript?: string }

class AcademyDatabase extends Dexie {
  progress!: EntityTable<SectionProgress, "sectionId">;
  attempts!: EntityTable<Attempt, "id">;
  settings!: EntityTable<SettingRow, "key">;
  reviews!: EntityTable<ReviewCard, "id">;
  recordings!: EntityTable<RecordingRow, "id">;

  constructor() {
    super("espanol-academy");
    this.version(1).stores({
      progress: "&sectionId, status, updatedAt",
      attempts: "++id, sectionId, completedAt",
      settings: "&key",
      reviews: "&id, sectionId, dueAt",
      recordings: "++id, sectionId, createdAt"
    });
  }
}

export const db = new AcademyDatabase();

export const defaultSettings: AccessibilitySettings = {
  theme: "system", font: "hyperlegible", textScale: 110, fontWeight: 500, lineHeight: 1.65,
  letterSpacing: 0.01, wordSpacing: 0.04, readingWidth: 72, density: "comfortable", focusWidth: 4,
  cursor: "standard", reducedMotion: false, hideDecoration: false, onboardingComplete: false
};

export async function loadSettings(): Promise<AccessibilitySettings> {
  return (await db.settings.get("accessibility"))?.value ?? defaultSettings;
}

export async function saveSettings(value: AccessibilitySettings) {
  await db.settings.put({ key: "accessibility", value });
}

export async function markStarted(sectionId: string) {
  const current = await db.progress.get(sectionId);
  if (!current) await db.progress.put({ sectionId, status: "in-progress", bestScore: 0, attempts: 0, updatedAt: new Date().toISOString() });
}

export async function recordAttempt(attempt: Attempt, threshold: number) {
  await db.transaction("rw", db.attempts, db.progress, async () => {
    await db.attempts.add(attempt);
    const current = await db.progress.get(attempt.sectionId);
    const bestScore = Math.max(current?.bestScore ?? 0, attempt.score);
    const mastered = bestScore >= threshold;
    await db.progress.put({
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
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings: await db.settings.toArray(),
    progress: await db.progress.toArray(),
    attempts: await db.attempts.toArray(),
    reviews: await db.reviews.toArray()
  };
}

export async function importLearningData(raw: unknown) {
  const data = raw as Awaited<ReturnType<typeof exportLearningData>>;
  if (data?.schemaVersion !== 1 || !Array.isArray(data.progress)) throw new Error("Unsupported or invalid academy backup.");
  await db.transaction("rw", db.settings, db.progress, db.attempts, db.reviews, async () => {
    await Promise.all([db.settings.clear(), db.progress.clear(), db.attempts.clear(), db.reviews.clear()]);
    await db.settings.bulkPut(data.settings);
    await db.progress.bulkPut(data.progress);
    await db.attempts.bulkPut(data.attempts.map(({ id: _id, ...attempt }) => attempt));
    await db.reviews.bulkPut(data.reviews);
  });
}

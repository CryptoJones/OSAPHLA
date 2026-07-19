export type ThemeId = "system" | "contrast-dark" | "contrast-light" | "low-glare" | "warm-paper" | "monochrome" | "midnight-blue" | "lavender-dusk" | "ocean-light" | "rose-clay" | "amber-night" | "slate-light" | "cream-ink" | "forest-night" | "burgundy-night" | "cobalt-light" | "soft-gray" | "black-amber" | "deep-ocean" | "cyberdeck" | "wcag-navy-coral" | "wcag-blue-orange-dark" | "wcag-plum-apricot" | "wcag-violet-cyan";

export interface AccessibilitySettings {
  theme: ThemeId;
  font: "system" | "hyperlegible" | "serif" | "mono";
  textScale: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  readingWidth: number;
  density: "comfortable" | "compact";
  focusWidth: number;
  cursor: "standard" | "large";
  reducedMotion: boolean;
  hideDecoration: boolean;
  onboardingComplete: boolean;
}

export interface VocabularyItem { es: string; en: string }
export interface ReadingAssignment {
  id: string; label: string; title: string; week: number; sectionId: string;
  passage: string; passageTranslation: string; focus: string; instructions: string; prompts: string[];
}
export interface ContentBlock { heading: string; body: string; translation?: string }
export interface Slide { title: string; kicker?: string; body: string[] }

export interface QuestionBase { id: string; prompt: string; rationale: string; objective?: string }
export interface MultipleChoiceQuestion extends QuestionBase { type: "multipleChoice"; choices: string[]; answer: string }
export interface ClozeQuestion extends QuestionBase { type: "cloze"; answer: string; accepted: string[]; accentPolicy: "warn" | "required" }
export interface OrderingQuestion extends QuestionBase { type: "ordering"; tokens: string[]; answers: string[][] }
export type Question = MultipleChoiceQuestion | ClozeQuestion | OrderingQuestion;

export interface Section {
  id: string; number: number; week: number; day: number; phase: string; level: string; kind: string;
  title: string; subtitle: string; objectives: string[]; grammar: string; pronunciation: string;
  content: ContentBlock[]; vocabulary: VocabularyItem[]; modelSentences: string[]; modelTranslations: string[]; reading?: string; readingTranslation?: string;
  culture?: string; mission?: string; readingAssignments: ReadingAssignment[]; slides: Slide[];
  media: { adaptive: true; audio: string; video: string; captions: string; transcript: string };
  questions: Question[]; masteryThreshold: number; estimatedMinutes: number;
}

export interface CourseModule {
  week: number; phase: string; level: string; title: string; canDo: string[]; sectionIds: string[]; readingAssignments: ReadingAssignment[];
}

export interface Course {
  schemaVersion: number; id: string; title: string; subtitle: string; description: string; target: string;
  disclaimer: string; modules: CourseModule[]; sections: Section[];
  readingAssignments: ReadingAssignment[]; generatedAt: string;
}

export interface SectionProgress {
  sectionId: string; status: "not-started" | "in-progress" | "mastered"; bestScore: number;
  attempts: number; completedAt?: string; updatedAt: string;
}

export interface Attempt {
  id?: number; sectionId: string; startedAt: string; completedAt: string; score: number;
  questionIds: string[]; answers: Record<string, string | string[]>;
}

export interface ReviewCard {
  id: string; sectionId: string; prompt: string; answer: string; intervalDays: number;
  ease: number; repetitions: number; dueAt: string;
}

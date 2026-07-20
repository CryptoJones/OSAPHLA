import type { ClozeQuestion, OrderingQuestion, Question } from "../types";

export function normalizeAnswer(value: string, preserveAccents = true) {
  const normalized = value.normalize("NFC").trim().replace(/[’‘]/g, "'").replace(/\s+/g, " ").toLocaleLowerCase("es");
  return preserveAccents ? normalized : normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeCloze(value: string, preserveAccents = true) {
  return normalizeAnswer(value, preserveAccents).replace(/^[¿¡]\s*/, "").replace(/[.!?]\s*$/, "");
}

export function isCorrect(question: Question, answer: string | string[]): { correct: boolean; accentWarning?: boolean } {
  if (question.type === "multipleChoice") return { correct: answer === question.answer };
  if (question.type === "ordering") {
    const value = Array.isArray(answer) ? answer : [];
    return { correct: question.answers.some((valid) => valid.length === value.length && valid.every((token, index) => token === value[index])) };
  }
  const typed = Array.isArray(answer) ? answer.join(" ") : answer;
  const exact = question.accepted.some((accepted) => normalizeCloze(accepted) === normalizeCloze(typed));
  if (exact) return { correct: true };
  if (question.accentPolicy === "warn") {
    const accentOnly = question.accepted.some((accepted) => normalizeCloze(accepted, false) === normalizeCloze(typed, false));
    if (accentOnly) return { correct: true, accentWarning: true };
  }
  return { correct: false };
}

export function selectAssessment(questions: Question[], seed = Date.now()) {
  const byType = (["multipleChoice", "cloze", "ordering"] as const).flatMap((type, typeIndex) => {
    const candidates = questions.filter((question) => question.type === type);
    return [...candidates].sort((a, b) => hash(`${a.id}-${seed + typeIndex}`) - hash(`${b.id}-${seed + typeIndex}`)).slice(0, 4);
  });
  return byType;
}

function hash(value: string) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function orderingLabel(question: OrderingQuestion) { return question.answers[0].join(" "); }
export function clozeHint(question: ClozeQuestion) { return `${question.answer.split(/\s+/).length} word${question.answer.includes(" ") ? "s" : ""}`; }

import type { ReviewCard } from "../types";

export function scheduleReview(card: ReviewCard, quality: 0 | 1 | 2 | 3 | 4 | 5, now = new Date()): ReviewCard {
  const success = quality >= 3;
  const repetitions = success ? card.repetitions + 1 : 0;
  const intervalDays = !success ? 1 : repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round(card.intervalDays * card.ease));
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const due = new Date(now);
  due.setDate(due.getDate() + intervalDays);
  return { ...card, repetitions, intervalDays, ease, dueAt: due.toISOString() };
}

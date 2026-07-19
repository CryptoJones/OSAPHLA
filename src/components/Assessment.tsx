import { useMemo, useState } from "react";
import { isCorrect, selectAssessment } from "../lib/answers";
import { recordAttempt } from "../lib/db";
import type { OrderingQuestion, Question, Section } from "../types";

export function Assessment({ section, onComplete }: { section: Section; onComplete: () => void }) {
  const [attemptSeed, setAttemptSeed] = useState(() => Date.now());
  const questions = useMemo(() => selectAssessment(section.questions, attemptSeed), [section.id, attemptSeed]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const results = submitted ? questions.map((question) => isCorrect(question, answers[question.id] ?? "")) : [];
  const correct = results.filter((result) => result.correct).length;
  const score = questions.length ? correct / questions.length : 0;

  function answer(id: string, value: string | string[]) { if (!submitted) setAnswers((current) => ({ ...current, [id]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (Object.keys(answers).length < questions.length) { document.getElementById("assessment-status")?.focus(); return; }
    const calculated = questions.filter((question) => isCorrect(question, answers[question.id]).correct).length / questions.length;
    await recordAttempt({ sectionId: section.id, startedAt, completedAt: new Date().toISOString(), score: calculated, questionIds: questions.map((question) => question.id), answers }, section.masteryThreshold);
    setSubmitted(true); onComplete();
  }
  function retry() { setAttemptSeed(Date.now()); setAnswers({}); setSubmitted(false); setStartedAt(new Date().toISOString()); }

  return <section className="assessment" aria-labelledby="assessment-title">
    <header><p className="eyebrow">Required after every section</p><h2 id="assessment-title">Mastery check</h2><p>Twelve items: four multiple choice, four fill in the blank, and four ordering. Target: 85%.</p></header>
    <div id="assessment-status" className={`assessment-status ${submitted ? (score >= section.masteryThreshold ? "pass" : "review") : ""}`} role="status" tabIndex={-1}>
      {submitted ? <><strong>{Math.round(score * 100)}%</strong><span>{score >= section.masteryThreshold ? "Section mastered. Keep the evidence, not just the score." : "Review the explanations and try a new balanced set."}</span></> : <><strong>{Object.keys(answers).length}/{questions.length}</strong><span>responses completed</span></>}
    </div>
    <form onSubmit={(event) => void submit(event)}>
      <ol className="question-list">
        {questions.map((question, index) => <li key={question.id} className={submitted ? (results[index].correct ? "correct" : "incorrect") : ""}>
          <QuestionInput question={question} value={answers[question.id]} onChange={(value) => answer(question.id, value)} disabled={submitted} number={index + 1} />
          {submitted && <div className="feedback" role="note"><strong>{results[index].correct ? "Correct." : "Repair this."}</strong> {question.rationale}{results[index].accentWarning && " Your answer communicated the word, but restore the written accent."}</div>}
        </li>)}
      </ol>
      <div className="button-row">{!submitted ? <button className="button primary" type="submit">Score this attempt</button> : <button className="button primary" type="button" onClick={retry}>Try a new balanced set</button>}</div>
    </form>
  </section>;
}

function QuestionInput({ question, value, onChange, disabled, number }: { question: Question; value?: string | string[]; onChange: (value: string | string[]) => void; disabled: boolean; number: number }) {
  const label = `${number}. ${question.prompt}`;
  if (question.type === "multipleChoice") return <fieldset><legend>{label}</legend><div className="choice-list">{question.choices.map((choice) => <label key={choice}><input type="radio" name={question.id} value={choice} checked={value === choice} onChange={() => onChange(choice)} disabled={disabled} /><span lang="es">{choice}</span></label>)}</div></fieldset>;
  if (question.type === "cloze") return <label className="cloze-label"><span>{label}</span><input lang="es" autoComplete="off" spellCheck={false} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></label>;
  return <OrderingInput question={question} value={Array.isArray(value) ? value : []} onChange={onChange} disabled={disabled} label={label} />;
}

function OrderingInput({ question, value, onChange, disabled, label }: { question: OrderingQuestion; value: string[]; onChange: (value: string[]) => void; disabled: boolean; label: string }) {
  const counts = new Map<string, number>(); value.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  const pool = question.tokens.filter((token) => { const count = counts.get(token) ?? 0; if (count > 0) { counts.set(token, count - 1); return false; } return true; });
  function move(index: number, direction: -1 | 1) { const next = [...value]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); }
  return <fieldset className="ordering"><legend>{label}</legend>
    <div className="ordered-zone" aria-label="Current answer sequence">{value.length ? value.map((token, index) => <span className="ordered-token" key={`${token}-${index}`}><span>{token}</span><button type="button" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${token} left`}>←</button><button type="button" disabled={disabled || index === value.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${token} right`}>→</button><button type="button" disabled={disabled} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${token}`}>×</button></span>) : <span className="drop-hint">Choose words below. Reorder with the arrow buttons.</span>}</div>
    <div className="token-pool" aria-label="Available words">{pool.map((token, index) => <button type="button" disabled={disabled} key={`${token}-${index}`} onClick={() => onChange([...value, token])}>{token}</button>)}</div>
  </fieldset>;
}

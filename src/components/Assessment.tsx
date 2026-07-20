import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCourse } from "../course";
import { isCorrect, selectAssessment } from "../lib/answers";
import { recordAttempt } from "../lib/db";
import type { Course, OrderingQuestion, Question, Section } from "../types";

export function Assessment({ course, section, onComplete }: { course: Course; section: Section; onComplete: () => void }) {
  const spanish = course.instructionLocale === "es-419";
  const { path } = useCourse();
  const next = course.sections[section.number];
  const [attemptSeed, setAttemptSeed] = useState(() => Date.now());
  const questions = useMemo(() => selectAssessment(section.questions, attemptSeed), [section.id, attemptSeed]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const results = submitted ? questions.map((question) => isCorrect(question, answers[question.id] ?? "")) : [];
  const correct = results.filter((result) => result.correct).length;
  const score = questions.length ? correct / questions.length : 0;

  function answer(id: string, value: string | string[], locked: boolean) { if (!locked) setAnswers((current) => ({ ...current, [id]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (Object.keys(answers).length < questions.length) { document.getElementById("assessment-status")?.focus(); return; }
    const calculated = questions.filter((question) => isCorrect(question, answers[question.id]).correct).length / questions.length;
    await recordAttempt({ courseSlug: course.slug, sectionId: section.id, startedAt, completedAt: new Date().toISOString(), score: calculated, questionIds: questions.map((question) => question.id), answers }, section.masteryThreshold);
    setSubmitted(true); onComplete();
  }
  // Correct answers lock in on grading; incorrect ones stay editable so a retry only
  // requires fixing what was wrong, not re-answering the whole set from scratch.
  function newSet() { setAttemptSeed(Date.now()); setAnswers({}); setSubmitted(false); setStartedAt(new Date().toISOString()); }

  return <section className="assessment" aria-labelledby="assessment-title">
    <header><p className="eyebrow">{spanish ? "Obligatorio después de cada sección" : "Required after every section"}</p><h2 id="assessment-title">{spanish ? "Comprobación de dominio" : "Mastery check"}</h2><p>{spanish ? "Doce reactivos: cuatro de opción múltiple, cuatro de espacios en blanco y cuatro de ordenación. Meta: 85 %." : "Twelve items: four multiple choice, four fill in the blank, and four ordering. Target: 85%."}</p></header>
    <form onSubmit={(event) => void submit(event)}>
      <ol className="question-list">
        {questions.map((question, index) => { const locked = submitted && results[index].correct; return <li key={question.id} className={submitted ? (results[index].correct ? "correct" : "incorrect") : ""}>
          <QuestionInput question={question} value={answers[question.id]} onChange={(value) => answer(question.id, value, locked)} disabled={locked} number={index + 1} targetLang={course.targetLocale.slice(0, 2)} spanish={spanish} />
          {submitted && <div className="feedback" role="note"><strong>{results[index].correct ? (spanish ? "Correcto." : "Correct.") : (spanish ? "Corrige esto." : "Repair this.")}</strong> {question.rationale}{results[index].accentWarning && (spanish ? " La respuesta comunica la palabra, pero debes restaurar el acento escrito." : " Your answer communicated the word, but restore the written accent.")}</div>}
        </li>; })}
      </ol>
      <div id="assessment-status" className={`assessment-status ${submitted ? (score >= section.masteryThreshold ? "pass" : "review") : ""}`} role="status" tabIndex={-1}>
        {submitted ? <><strong>{Math.round(score * 100)}%</strong><span>{score >= section.masteryThreshold ? (spanish ? "Sección dominada. Conserva la evidencia, no solo la puntuación." : "Section mastered. Keep the evidence, not just the score.") : (spanish ? "Revisa las explicaciones e intenta otro conjunto equilibrado." : "Review the explanations and try a new balanced set.")}</span></> : <><strong>{Object.keys(answers).length}/{questions.length}</strong><span>{spanish ? "respuestas completadas" : "responses completed"}</span></>}
      </div>
      {submitted && score >= section.masteryThreshold && <Link className="continue-cta" to={next ? path(`lesson/${next.id}`) : path()}>{next ? (spanish ? `Continuar a la sección ${next.number} →` : `Continue to section ${next.number} →`) : (spanish ? "Inicio final →" : "Final dashboard →")}</Link>}
      <div className="button-row">
        {!submitted && <button className="button primary" type="submit">{spanish ? "Calificar intento" : "Score this attempt"}</button>}
        {submitted && score < 1 && <button className={`button ${score < section.masteryThreshold ? "primary" : ""}`} type="submit">{spanish ? "Revisar correcciones" : "Check corrections"}</button>}
        {submitted && <button className="button" type="button" onClick={newSet}>{spanish ? "Empezar un conjunto nuevo" : "Start a new set"}</button>}
      </div>
    </form>
  </section>;
}

function QuestionInput({ question, value, onChange, disabled, number, targetLang, spanish }: { question: Question; value?: string | string[]; onChange: (value: string | string[]) => void; disabled: boolean; number: number; targetLang: string; spanish: boolean }) {
  const label = `${number}. ${question.prompt}`;
  if (question.type === "multipleChoice") return <fieldset><legend>{label}</legend><div className="choice-list">{question.choices.map((choice) => <label key={choice}><input type="radio" name={question.id} value={choice} checked={value === choice} onChange={() => onChange(choice)} disabled={disabled} /><span lang={targetLang}>{choice}</span></label>)}</div></fieldset>;
  if (question.type === "cloze") return <label className="cloze-label"><span>{label}</span><input lang={targetLang} autoComplete="off" spellCheck={false} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></label>;
  return <OrderingInput question={question} value={Array.isArray(value) ? value : []} onChange={onChange} disabled={disabled} label={label} spanish={spanish} targetLang={targetLang} />;
}

function OrderingInput({ question, value, onChange, disabled, label, spanish, targetLang }: { question: OrderingQuestion; value: string[]; onChange: (value: string[]) => void; disabled: boolean; label: string; spanish: boolean; targetLang: string }) {
  const counts = new Map<string, number>(); value.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  const pool = question.tokens.filter((token) => { const count = counts.get(token) ?? 0; if (count > 0) { counts.set(token, count - 1); return false; } return true; });
  function move(index: number, direction: -1 | 1) { const next = [...value]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); }
  return <fieldset className="ordering"><legend>{label}</legend>
    <div className="ordered-zone" aria-label={spanish ? "Secuencia actual" : "Current answer sequence"}>{value.length ? value.map((token, index) => <span className="ordered-token" key={`${token}-${index}`}><span lang={targetLang}>{token}</span><button type="button" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`${spanish ? "Mover" : "Move"} ${token} ${spanish ? "a la izquierda" : "left"}`}>←</button><button type="button" disabled={disabled || index === value.length - 1} onClick={() => move(index, 1)} aria-label={`${spanish ? "Mover" : "Move"} ${token} ${spanish ? "a la derecha" : "right"}`}>→</button><button type="button" disabled={disabled} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} aria-label={`${spanish ? "Quitar" : "Remove"} ${token}`}>×</button></span>) : <span className="drop-hint">{spanish ? "Elige palabras abajo y ordénalas con las flechas." : "Choose words below. Reorder with the arrow buttons."}</span>}</div>
    <div className="token-pool" aria-label={spanish ? "Palabras disponibles" : "Available words"}>{pool.map((token, index) => <button lang={targetLang} type="button" disabled={disabled} key={`${token}-${index}`} onClick={() => onChange([...value, token])}>{token}</button>)}</div>
  </fieldset>;
}

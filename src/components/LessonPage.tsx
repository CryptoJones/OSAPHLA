import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { markStarted } from "../lib/db";
import type { Course, SectionProgress } from "../types";
import { AdaptivePlayer } from "./AdaptivePlayer";
import { Assessment } from "./Assessment";
import { SpeechLab } from "./SpeechLab";

export function LessonPage({ course, progress, onProgress }: { course: Course; progress: Record<string, SectionProgress>; onProgress: () => void }) {
  const { sectionId } = useParams();
  const section = course.sections.find((item) => item.id === sectionId);
  const pronunciation = useRef<HTMLAudioElement | null>(null);
  const [pronunciationNotice, setPronunciationNotice] = useState("");
  useEffect(() => { if (section) void markStarted(section.id).then(onProgress); window.scrollTo({ top: 0, behavior: "instant" }); }, [section?.id]);
  useEffect(() => () => { pronunciation.current?.pause(); }, []);
  if (!section) return <Navigate to="/course" replace />;
  const previous = course.sections[section.number - 2];
  const next = course.sections[section.number];
  const state = progress[section.id];

  function playVocabulary(index: number, word: string) {
    pronunciation.current?.pause();
    const audio = new Audio(`/media/${section!.id}/vocabulary/${String(index).padStart(2, "0")}.mp3`);
    pronunciation.current = audio;
    audio.onplay = () => setPronunciationNotice(`Playing ${word}.`);
    audio.onended = () => setPronunciationNotice("");
    audio.onerror = () => setPronunciationNotice("Rendered pronunciation audio is not installed yet.");
    void audio.play().catch(() => setPronunciationNotice("Rendered pronunciation audio is not installed yet."));
  }

  return <article className="lesson-page">
    <header className="lesson-hero">
      <div className="lesson-breadcrumb"><Link to="/course">Course map</Link><span aria-hidden="true">/</span><span>Week {section.week}</span><span aria-hidden="true">/</span><span>Section {section.number}</span></div>
      <div className="lesson-title-row"><div><span className="badge">{section.phase} · {section.level} · {section.estimatedMinutes} minutes</span><h1>{section.title}</h1><p>{section.subtitle}</p></div>{state && <div className={`mastery-stamp ${state.status}`}><strong>{Math.round(state.bestScore * 100)}%</strong><span>{state.status.replace("-", " ")}</span></div>}</div>
      <ul className="objective-list">{section.objectives.map((objective) => <li key={objective}>I can {objective}.</li>)}</ul>
    </header>

    <div className="lesson-body">
      <AdaptivePlayer section={section} />
      <section className="lesson-content" aria-labelledby="lesson-notes-title"><p className="eyebrow">Semantic lesson</p><h2 id="lesson-notes-title">Instruction and field notes</h2>
        {section.content.map((block) => <section key={block.heading}><h3>{block.heading}</h3><p lang={block.translation ? "es" : undefined}>{block.body}</p>{block.translation && <p className="english-meaning"><strong>English meaning:</strong> {block.translation}</p>}</section>)}
      </section>

      <section className="vocabulary" aria-labelledby="vocab-title"><p className="eyebrow">Retrieval deck</p><h2 id="vocab-title">Active vocabulary</h2><div className="vocab-grid">{section.vocabulary.map((item, index) => <article key={item.es}><strong lang="es">{item.es}</strong><span>{item.en}</span><button type="button" onClick={() => playVocabulary(index, item.es)} aria-label={`Hear ${item.es}`}>Hear</button></article>)}</div><p className="sr-only" role="status" aria-live="polite">{pronunciationNotice}</p></section>

      <section className="models" aria-labelledby="models-title"><p className="eyebrow">Pattern evidence</p><h2 id="models-title">Model sentences</h2><ol>{section.modelSentences.map((sentence, index) => <li key={sentence}><strong lang="es">{sentence}</strong><span>{section.modelTranslations[index]}</span></li>)}</ol></section>

      {section.readingAssignments.length > 0 && <section className="reader-assignments" aria-labelledby="reader-assignment-title"><p className="eyebrow">Extensive reading</p><h2 id="reader-assignment-title">Assigned reading activities</h2><ul>{section.readingAssignments.map((assignment) => <li key={assignment.id}><Link to={`/readers?activity=${encodeURIComponent(assignment.id)}`}><strong>{assignment.label}</strong><span>{assignment.focus}</span></Link></li>)}</ul></section>}

      <SpeechLab sectionId={section.id} target={section.modelSentences[0]} meaning={section.modelTranslations[0]} />
      <Assessment section={section} onComplete={onProgress} />
    </div>

    <nav className="lesson-nav" aria-label="Section navigation">{previous ? <Link to={`/lesson/${previous.id}`}>← Section {previous.number}<small>{previous.title}</small></Link> : <span />}{next ? <Link to={`/lesson/${next.id}`}>Section {next.number} →<small>{next.title}</small></Link> : <Link to="/">Final dashboard →</Link>}</nav>
  </article>;
}

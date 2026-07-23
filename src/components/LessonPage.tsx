import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useCourse } from "../course";
import { markStarted } from "../lib/db";
import { mediaUrl } from "../lib/media";
import type { Course, SectionProgress } from "../types";
import { AdaptivePlayer } from "./AdaptivePlayer";
import { Assessment } from "./Assessment";
import { SpeechLab } from "./SpeechLab";

export function LessonPage({ course, progress, onProgress }: { course: Course; progress: Record<string, SectionProgress>; onProgress: () => void }) {
  const { copy, path } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const { sectionId } = useParams();
  const section = course.sections.find((item) => item.id === sectionId);
  const pronunciation = useRef<HTMLAudioElement | null>(null);
  const [pronunciationNotice, setPronunciationNotice] = useState("");
  useEffect(() => { if (section) void markStarted(course.slug, section.id).then(onProgress); }, [section?.id, course.slug]);
  // This page instance is reused across "Continue to next section" navigation (only
  // section/sectionId change, no remount), so a vocabulary word still narrating from the
  // section just left would otherwise keep playing — and its notice keep showing — here.
  useEffect(() => { pronunciation.current?.pause(); pronunciation.current = null; setPronunciationNotice(""); }, [section?.id, course.slug]);
  useEffect(() => () => { pronunciation.current?.pause(); }, []);
  if (!section) return <Navigate to={path("course")} replace />;
  const previous = course.sections[section.number - 2];
  const next = course.sections[section.number];
  const state = progress[section.id];

  function playVocabulary(index: number, word: string) {
    pronunciation.current?.pause();
    const audio = new Audio(mediaUrl(`media/${course.slug}/${section!.id}/vocabulary/${String(index).padStart(2, "0")}.mp3`));
    pronunciation.current = audio;
    audio.onplay = () => setPronunciationNotice(copy.playing(word));
    audio.onended = () => setPronunciationNotice("");
    audio.onerror = () => setPronunciationNotice(copy.unavailableAudio);
    void audio.play().catch(() => setPronunciationNotice(copy.unavailableAudio));
  }

  return <article className="lesson-page">
    <header className="lesson-hero">
      <div className="lesson-breadcrumb"><Link to={path("course")}>{copy.courseMap}</Link><span aria-hidden="true">/</span><span>{copy.week} {section.week}</span><span aria-hidden="true">/</span><span>{copy.section} {section.number}</span></div>
      <div className="lesson-title-row"><div><span className="badge">{section.phase} · {section.level} · {section.estimatedMinutes} {copy.minutes}</span><h1>{section.title}</h1><p>{section.subtitle}</p></div>{state && <div className={`mastery-stamp ${state.status}`}><strong>{Math.round(state.bestScore * 100)}%</strong><span>{spanish ? (state.status === "mastered" ? "dominada" : "en progreso") : state.status.replace("-", " ")}</span></div>}</div>
      <ul className="objective-list">{section.objectives.map((objective) => <li key={objective}>{spanish ? "Puedo" : "I can"} {objective}.</li>)}</ul>
    </header>

    <div className="lesson-body">
      <AdaptivePlayer section={section} />
      <section className="lesson-content" aria-labelledby="lesson-notes-title"><p className="eyebrow">{spanish ? "Lección semántica" : "Semantic lesson"}</p><h2 id="lesson-notes-title">{spanish ? "Instrucción y notas de campo" : "Instruction and field notes"}</h2>
        {section.content.map((block) => <section key={block.heading}><h3>{block.heading}</h3><p lang={block.translation ? course.targetLocale.slice(0, 2) : course.instructionLocale.slice(0, 2)}>{block.body}</p>{block.translation && <p className="english-meaning"><strong>{spanish ? "Significado en español:" : "English meaning:"}</strong> {block.translation}</p>}</section>)}
      </section>

      <section className="vocabulary" aria-labelledby="vocab-title"><p className="eyebrow">{spanish ? "Tarjetas de recuperación" : "Retrieval deck"}</p><h2 id="vocab-title">{spanish ? "Vocabulario activo" : "Active vocabulary"}</h2><div className="vocab-grid">{section.vocabulary.map((item, index) => <article key={item.target}><strong lang={course.targetLocale.slice(0, 2)}>{item.target}</strong><span>{item.meaning}</span><button type="button" onClick={() => playVocabulary(index, item.target)} aria-label={`${copy.hear} ${item.target}`}>{copy.hear}</button></article>)}</div><p className="sr-only" role="status" aria-live="polite">{pronunciationNotice}</p></section>

      <section className="models" aria-labelledby="models-title"><p className="eyebrow">{spanish ? "Evidencia de patrones" : "Pattern evidence"}</p><h2 id="models-title">{spanish ? "Oraciones modelo" : "Model sentences"}</h2><ol>{section.modelSentences.map((sentence, index) => <li key={sentence}><strong lang={course.targetLocale.slice(0, 2)}>{sentence}</strong><span>{section.modelTranslations[index]}</span></li>)}</ol></section>

      {section.readingAssignments.length > 0 && <section className="reader-assignments" aria-labelledby="reader-assignment-title"><p className="eyebrow">{spanish ? "Lectura extensiva" : "Extensive reading"}</p><h2 id="reader-assignment-title">{spanish ? "Actividades de lectura asignadas" : "Assigned reading activities"}</h2><ul>{section.readingAssignments.map((assignment) => <li key={assignment.id}><Link to={`${path("readers")}?activity=${encodeURIComponent(assignment.id)}`}><strong>{assignment.label}</strong><span>{assignment.focus}</span></Link></li>)}</ul></section>}

      <SpeechLab course={course} sectionId={section.id} target={section.modelSentences[0]} meaning={section.modelTranslations[0]} />
      <Assessment course={course} section={section} onComplete={onProgress} />
    </div>

    <nav className="lesson-nav" aria-label={spanish ? "Navegación de secciones" : "Section navigation"}>{previous ? <Link to={path(`lesson/${previous.id}`)}>← {copy.section} {previous.number}<small>{previous.title}</small></Link> : <span />}{next ? <Link to={path(`lesson/${next.id}`)}>{copy.section} {next.number} →<small>{next.title}</small></Link> : <Link to={path()}>{spanish ? "Inicio final" : "Final dashboard"} →</Link>}</nav>
  </article>;
}

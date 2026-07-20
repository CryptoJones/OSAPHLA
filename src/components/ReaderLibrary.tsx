import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCourse } from "../course";
import type { Course } from "../types";

export function ReaderLibrary({ course }: { course: Course }) {
  const { path } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("activity");
  const panelRef = useRef<HTMLElement>(null);
  const selected = course.readingAssignments.find((assignment) => assignment.id === selectedId);
  useEffect(() => { if (selected) panelRef.current?.focus(); }, [selectedId]);

  return <div className="page">
    <header className="page-title"><p className="eyebrow">{spanish ? "Lectura extensiva" : "Extensive reading"}</p><h1>{spanish ? "88 actividades de lectura asignadas." : "88 assigned reading activities."}</h1><p>{spanish ? "Abre una actividad para ver el texto completo, su enfoque y preguntas de comprensión." : "Open an activity for its complete course passage, reading focus, and comprehension prompts."}</p></header>
    <div className="reader-browser">
      <nav className="reader-assignment-index" aria-label={spanish ? "Índice de actividades" : "Reading activity index"}>
        {course.modules.map((module) => <section key={module.week}><h2>{spanish ? "Semana" : "Week"} {module.week}: {module.title}</h2><ol>{module.readingAssignments.map((assignment) => <li key={assignment.id}><button type="button" aria-expanded={selectedId === assignment.id} onClick={() => setSearchParams({ activity: assignment.id })}><span>{assignment.label}</span><small>{assignment.focus}</small></button></li>)}</ol></section>)}
      </nav>
      <section className="reading-activity-panel" ref={panelRef} tabIndex={-1} aria-live="polite">
        {selected ? <>
          <p className="eyebrow">{spanish ? "Semana" : "Week"} {selected.week} · {selected.focus}</p>
          <h2>{selected.title}</h2>
          <p>{selected.instructions}</p>
          <article className="reading-passage"><h3>{spanish ? "Texto" : "Passage"}</h3><p lang={course.targetLocale.slice(0, 2)}>{selected.passage}</p><p className="english-meaning"><strong>{spanish ? "Significado en español:" : "English meaning:"}</strong> {selected.passageTranslation}</p></article>
          <section aria-labelledby="reading-prompts-title"><h3 id="reading-prompts-title">{spanish ? "Preguntas de comprensión" : "Comprehension prompts"}</h3><ol>{selected.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol></section>
          <div className="button-row"><Link className="button primary" to={path(`lesson/${selected.sectionId}`)}>{spanish ? "Abrir la lección asignada" : "Open assigned lesson"}</Link><button type="button" onClick={() => setSearchParams({})}>{spanish ? "Cerrar actividad" : "Close activity"}</button></div>
        </> : <div className="reader-empty"><p className="eyebrow">{spanish ? "Elige una actividad" : "Choose an activity"}</p><h2>{spanish ? "Tu espacio de lectura se abre aquí." : "Your reading workspace opens here."}</h2><p>{spanish ? "Cada semana ofrece dos o tres actividades complementarias: idea principal, evidencia y detalle, o lenguaje y reconstrucción." : "Each week has two or three complementary activities: main idea, evidence and detail, or language and retelling."}</p></div>}
      </section>
    </div>
  </div>;
}

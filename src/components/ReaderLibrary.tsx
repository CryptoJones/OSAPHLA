import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Course } from "../types";

export function ReaderLibrary({ course }: { course: Course }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const selected = course.readingAssignments.find((assignment) => assignment.id === selectedId);
  useEffect(() => { if (selected) panelRef.current?.focus(); }, [selectedId]);

  return <div className="page">
    <header className="page-title"><p className="eyebrow">Extensive reading</p><h1>88 assigned reading activities.</h1><p>Open an activity for its complete course passage, reading focus, and comprehension prompts.</p></header>
    <div className="reader-browser">
      <nav className="reader-assignment-index" aria-label="Reading activity index">
        {course.modules.map((module) => <section key={module.week}><h2>Week {module.week}: {module.title}</h2><ol>{module.readingAssignments.map((assignment) => <li key={assignment.id}><button type="button" aria-expanded={selectedId === assignment.id} onClick={() => setSelectedId(assignment.id)}><span>{assignment.label}</span><small>{assignment.focus}</small></button></li>)}</ol></section>)}
      </nav>
      <section className="reading-activity-panel" ref={panelRef} tabIndex={-1} aria-live="polite">
        {selected ? <>
          <p className="eyebrow">Week {selected.week} · {selected.focus}</p>
          <h2>{selected.title}</h2>
          <p>{selected.instructions}</p>
          <article className="reading-passage"><h3>Passage</h3><p lang="es">{selected.passage}</p><p className="english-meaning"><strong>English meaning:</strong> {selected.passageTranslation}</p></article>
          <section aria-labelledby="reading-prompts-title"><h3 id="reading-prompts-title">Comprehension prompts</h3><ol>{selected.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol></section>
          <div className="button-row"><Link className="button primary" to={`/lesson/${selected.sectionId}`}>Open assigned lesson</Link><button type="button" onClick={() => setSelectedId(null)}>Close activity</button></div>
        </> : <div className="reader-empty"><p className="eyebrow">Choose an activity</p><h2>Your reading workspace opens here.</h2><p>Each week has two or three complementary activities: main idea, evidence and detail, or language and retelling.</p></div>}
      </section>
    </div>
  </div>;
}

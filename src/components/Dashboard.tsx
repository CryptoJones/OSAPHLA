import { Link } from "react-router-dom";
import { useCourse } from "../course";
import type { Course, SectionProgress } from "../types";

export function Dashboard({ course, progress }: { course: Course; progress: Record<string, SectionProgress> }) {
  const { path } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const mastered = Object.values(progress).filter((item) => item.status === "mastered").length;
  const started = Object.values(progress).filter((item) => item.status !== "not-started").length;
  const next = course.sections.find((section) => progress[section.id]?.status !== "mastered") ?? course.sections[0];
  const percent = Math.round((mastered / course.sections.length) * 100);
  const currentWeek = next.week;

  return <div className="page dashboard-page">
    <section className="hero" aria-labelledby="hero-title">
      <p className="eyebrow">OSAPHLA · {spanish ? "academia de inglés de 36 semanas" : "36-week Pan-Hispanic academy"}</p>
      <h1 id="hero-title">{spanish ? "Aprende inglés útil, no una racha." : "Train for useful Spanish, not a streak."}</h1>
      <p>{course.description}</p>
      <div className="hero-actions"><Link className="button primary" to={path(`lesson/${next.id}`)}>{started ? (spanish ? "Continuar" : "Continue training") : (spanish ? "Comenzar la primera semana" : "Begin week one")}</Link><Link className="button" to={path("course")}>{spanish ? "Abrir el mapa del curso" : "Open course map"}</Link></div>
    </section>

    <section aria-labelledby="status-title">
      <div className="section-heading"><div><p className="eyebrow">{spanish ? "Registro de aprendizaje" : "Learning record"}</p><h2 id="status-title">{spanish ? "Estado actual" : "Current status"}</h2></div><strong className="big-stat">{percent}%</strong></div>
      <div className="progress-track" role="progressbar" aria-label={spanish ? `${mastered} de ${course.sections.length} secciones dominadas` : `${mastered} of ${course.sections.length} sections mastered`} aria-valuemin={0} aria-valuemax={course.sections.length} aria-valuenow={mastered}><span style={{ width: `${percent}%` }} /></div>
      <div className="stat-grid">
        <article className="stat-card"><strong>{mastered}</strong><span>{spanish ? "dominadas" : "mastered"}</span></article>
        <article className="stat-card"><strong>{started}</strong><span>{spanish ? "iniciadas" : "started"}</span></article>
        <article className="stat-card"><strong>{course.sections.length - mastered}</strong><span>{spanish ? "restantes" : "remaining"}</span></article>
        <article className="stat-card"><strong>{course.readingAssignments.length}</strong><span>{spanish ? "actividades de lectura" : "reading activities"}</span></article>
      </div>
    </section>

    <section aria-labelledby="now-title">
      <p className="eyebrow">{spanish ? "Siguiente recomendación" : "Recommended next"}</p><h2 id="now-title">{spanish ? "Semana" : "Week"} {currentWeek}: {course.modules[currentWeek - 1].title}</h2>
      <article className="next-card"><div><span className="badge">{spanish ? "Sección" : "Section"} {next.number} · {next.level}</span><h3>{next.title}</h3><p>{next.objectives.join(" · ")}</p></div><Link className="button primary" to={path(`lesson/${next.id}`)}>{spanish ? "Abrir sección" : "Open section"}</Link></article>
    </section>

    <section className="principles" aria-labelledby="principles-title">
      <p className="eyebrow">{spanish ? "El sistema de trabajo" : "The operating system"}</p><h2 id="principles-title">{spanish ? "Cada sección sigue el mismo ciclo completo" : "Every section follows the same complete loop"}</h2>
      <div className="feature-grid">
        <article><span>01</span><h3>{spanish ? "Instrucción adaptable" : "Adaptive instruction"}</h3><p>{spanish ? "Diapositivas temáticas, narración local, subtítulos y transcripción completa." : "Themeable semantic slides, local narration, captions, and a complete transcript."}</p></article>
        <article><span>02</span><h3>{spanish ? "Usa el idioma" : "Use the language"}</h3><p>{spanish ? "Vocabulario, modelos, lectura, evidencia cultural y una misión productiva." : "Vocabulary, model sentences, reading or culture evidence, and a productive mission."}</p></article>
        <article><span>03</span><h3>{spanish ? "Demuestra la recuperación" : "Prove retrieval"}</h3><p>{spanish ? "Opción múltiple, espacios en blanco y ordenación en cada intento." : "Multiple choice, fill-in-the-blank, and ordering on every attempt."}</p></article>
        <article><span>04</span><h3>{spanish ? "Corrige y repite" : "Repair and repeat"}</h3><p>{spanish ? "Explicaciones, meta del 85 % y ningún bloqueo artificial." : "Explanatory feedback, an 85% mastery target, and no artificial lockouts."}</p></article>
      </div>
    </section>
  </div>;
}

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
  const currentModule = course.modules.find((module) => module.week === currentWeek);
  const weekSections = currentModule?.sectionIds.map((id) => course.sections.find((section) => section.id === id)!).filter(Boolean) ?? [];

  return <div className="page dashboard-page">
    <section className="hero dashboard-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">{spanish ? "Tu espacio de aprendizaje" : "Your learning space"}</p>
        <span className="hero-week-label">{spanish ? "Semana" : "Week"} {currentWeek} <i aria-hidden="true">·</i> {currentModule?.phase ?? next.phase}</span>
        <h1 id="hero-title">{spanish ? "Aprende inglés útil, no una racha." : "Train for useful Spanish, not a streak."}</h1>
        <p>{course.description}</p>
        <div className="hero-actions"><Link className="button primary" to={path(`lesson/${next.id}`)}>{started ? (spanish ? "Continuar aprendiendo" : "Continue learning") : (spanish ? "Comenzar la primera semana" : "Begin week one")} <span aria-hidden="true">→</span></Link><Link className="button quiet" to={path("course")}>{spanish ? "Ver plan completo" : "View full curriculum"}</Link></div>
      </div>
      <aside className="session-card" aria-labelledby="session-card-title">
        <div className="session-card-top"><span className="session-icon" aria-hidden="true">▶</span><span className="badge">{spanish ? "A continuación" : "Up next"}</span></div>
        <h2 id="session-card-title">{next.title}</h2>
        <p>{next.subtitle}</p>
        <dl>
          <div><dt>{spanish ? "Nivel" : "Level"}</dt><dd>{next.level}</dd></div>
          <div><dt>{spanish ? "Tiempo" : "Time"}</dt><dd>{next.estimatedMinutes} min</dd></div>
          <div><dt>{spanish ? "Sección" : "Section"}</dt><dd>{next.number} / {course.sections.length}</dd></div>
        </dl>
        <Link className="session-link" to={path(`lesson/${next.id}`)}>{spanish ? "Abrir la lección" : "Open lesson"} <span aria-hidden="true">↗</span></Link>
      </aside>
    </section>

    <section className="learning-overview" aria-labelledby="status-title">
      <div className="section-heading"><div><p className="eyebrow">{spanish ? "Tu progreso" : "Your progress"}</p><h2 id="status-title">{spanish ? "El aprendizaje se acumula." : "Learning that compounds."}</h2><p>{spanish ? "Cada sección dominada fortalece la siguiente." : "Every mastered section strengthens the next one."}</p></div><div className="progress-orbit" aria-hidden="true"><strong>{percent}%</strong><span>{spanish ? "completo" : "complete"}</span></div></div>
      <div className="progress-track" role="progressbar" aria-label={spanish ? `${mastered} de ${course.sections.length} secciones dominadas` : `${mastered} of ${course.sections.length} sections mastered`} aria-valuemin={0} aria-valuemax={course.sections.length} aria-valuenow={mastered}><span style={{ width: `${percent}%` }} /></div>
      <div className="stat-grid">
        <article className="stat-card"><span className="stat-symbol" aria-hidden="true">✓</span><strong>{mastered}</strong><span>{spanish ? "Dominadas" : "Mastered"}</span><small>{spanish ? "Meta alcanzada" : "Target reached"}</small></article>
        <article className="stat-card"><span className="stat-symbol" aria-hidden="true">◒</span><strong>{started}</strong><span>{spanish ? "En marcha" : "In progress"}</span><small>{spanish ? "Lecciones activas" : "Active lessons"}</small></article>
        <article className="stat-card"><span className="stat-symbol" aria-hidden="true">◎</span><strong>{course.sections.length - mastered}</strong><span>{spanish ? "Por explorar" : "To explore"}</span><small>{spanish ? "Sin bloqueos" : "Always available"}</small></article>
        <article className="stat-card"><span className="stat-symbol" aria-hidden="true">≡</span><strong>{course.readingAssignments.length}</strong><span>{spanish ? "Lecturas" : "Readings"}</span><small>{spanish ? "Práctica extensa" : "Extensive practice"}</small></article>
      </div>
    </section>

    <section className="week-focus" aria-labelledby="now-title">
      <div className="section-heading"><div><p className="eyebrow">{spanish ? "Tu semana actual" : "This week"}</p><h2 id="now-title">{spanish ? "Semana" : "Week"} {currentWeek}{currentModule ? `: ${currentModule.title}` : ""}</h2></div><Link to={path("course")}>{spanish ? "Ver las 36 semanas" : "View all 36 weeks"} <span aria-hidden="true">→</span></Link></div>
      <div className="week-path">
        {weekSections.map((section) => {
          const sectionState = progress[section.id]?.status ?? "not-started";
          return <Link className={`week-path-item ${section.id === next.id ? "current" : ""} ${sectionState}`} to={path(`lesson/${section.id}`)} key={section.id}>
            <span className="week-path-index">{String(section.day).padStart(2, "0")}</span>
            <span><strong>{section.title.split(":")[0]}</strong><small>{section.estimatedMinutes} min · {sectionState === "mastered" ? (spanish ? "Dominada" : "Mastered") : section.id === next.id ? (spanish ? "Siguiente" : "Up next") : (spanish ? "Disponible" : "Available")}</small></span>
            <span aria-hidden="true">{sectionState === "mastered" ? "✓" : "→"}</span>
          </Link>;
        })}
      </div>
    </section>

    <section className="principles" aria-labelledby="principles-title">
      <p className="eyebrow">{spanish ? "Cómo aprendes" : "How you learn"}</p><h2 id="principles-title">{spanish ? "Un ciclo claro. Práctica real." : "A clear loop. Real practice."}</h2>
      <div className="feature-grid">
        <article><span>01</span><div className="feature-icon" aria-hidden="true">◫</div><h3>{spanish ? "Mira y escucha" : "See and hear"}</h3><p>{spanish ? "Diapositivas temáticas, narración local, subtítulos y transcripción completa." : "Themeable slides, local narration, captions, and a complete transcript."}</p></article>
        <article><span>02</span><div className="feature-icon" aria-hidden="true">◇</div><h3>{spanish ? "Construye patrones" : "Build patterns"}</h3><p>{spanish ? "Vocabulario activo, modelos útiles, lectura y evidencia cultural." : "Active vocabulary, useful models, reading, and cultural evidence."}</p></article>
        <article><span>03</span><div className="feature-icon" aria-hidden="true">◉</div><h3>{spanish ? "Recuerda activamente" : "Retrieve actively"}</h3><p>{spanish ? "Preguntas variadas convierten el reconocimiento en memoria." : "Varied questions turn recognition into durable memory."}</p></article>
        <article><span>04</span><div className="feature-icon" aria-hidden="true">↻</div><h3>{spanish ? "Corrige y avanza" : "Repair and advance"}</h3><p>{spanish ? "Explicaciones claras, meta del 85 % y ningún bloqueo artificial." : "Clear feedback, an 85% mastery target, and no artificial lockouts."}</p></article>
      </div>
    </section>
  </div>;
}

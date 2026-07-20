import { Link } from "react-router-dom";
import { useCourse } from "../course";
import type { Course, SectionProgress } from "../types";

export function CourseMap({ course, progress }: { course: Course; progress: Record<string, SectionProgress> }) {
  const { path } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  return <div className="page">
    <header className="page-title"><p className="eyebrow">{spanish ? "Plan completo" : "Complete curriculum"}</p><h1>{spanish ? "Mapa del curso de 36 semanas" : "36-week course map"}</h1><p>{spanish ? "Sigue el orden recomendado o abre cualquier sección. Las indicaciones orientan; nunca bloquean." : "Follow the recommended order or open any section. A flag is guidance, never a lock."}</p></header>
    <div className="phase-key" aria-label={spanish ? "Fases del curso" : "Course phases"}>{[...new Set(course.modules.map((module) => module.phase))].map((phase) => <span key={phase}>{phase}</span>)}</div>
    <div className="week-list">
      {course.modules.map((module) => {
        const moduleSections = module.sectionIds.map((id) => course.sections.find((section) => section.id === id)!);
        const mastered = moduleSections.filter((section) => progress[section.id]?.status === "mastered").length;
        return <section className="week-card" key={module.week} aria-labelledby={`week-${module.week}`}>
          <header><div><span className="badge">{module.phase} · {module.level}</span><h2 id={`week-${module.week}`}>{spanish ? "Semana" : "Week"} {module.week}: {module.title}</h2></div><span aria-label={spanish ? `${mastered} de 5 dominadas` : `${mastered} of 5 mastered`}>{mastered}/5</span></header>
          <ul className="can-do-list">{module.canDo.map((goal) => <li key={goal}>{goal}</li>)}</ul>
          <div className="section-row">
            {moduleSections.map((section) => {
              const state = progress[section.id]?.status ?? "not-started";
              const stateLabel = spanish ? (state === "mastered" ? "dominada" : state === "in-progress" ? "en progreso" : "no iniciada") : state.replace("-", " ");
              return <Link className={`section-chip ${state}`} to={path(`lesson/${section.id}`)} key={section.id} aria-label={`${spanish ? "Sección" : "Section"} ${section.number}, ${section.title}, ${stateLabel}`}>
                <span>{section.day}</span><strong>{section.title.split(":")[0]}</strong><small>{state === "mastered" ? (spanish ? "dominada" : "mastered") : state === "in-progress" ? (spanish ? "en progreso" : "in progress") : `${section.estimatedMinutes} min`}</small>
              </Link>;
            })}
          </div>
        </section>;
      })}
    </div>
  </div>;
}

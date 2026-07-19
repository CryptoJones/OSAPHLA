import { Link } from "react-router-dom";
import type { Course, SectionProgress } from "../types";

export function CourseMap({ course, progress }: { course: Course; progress: Record<string, SectionProgress> }) {
  return <div className="page">
    <header className="page-title"><p className="eyebrow">Complete curriculum</p><h1>36-week course map</h1><p>Follow the recommended order or open any section. A flag is guidance, never a lock.</p></header>
    <div className="phase-key" aria-label="Course phases"><span>Launch</span><span>Foundations</span><span>Daily Life</span><span>Mobility</span><span>Narrative</span><span>Precision</span><span>Projection</span><span>Systems</span><span>Capstone</span></div>
    <div className="week-list">
      {course.modules.map((module) => {
        const moduleSections = module.sectionIds.map((id) => course.sections.find((section) => section.id === id)!);
        const mastered = moduleSections.filter((section) => progress[section.id]?.status === "mastered").length;
        return <section className="week-card" key={module.week} aria-labelledby={`week-${module.week}`}>
          <header><div><span className="badge">{module.phase} · {module.level}</span><h2 id={`week-${module.week}`}>Week {module.week}: {module.title}</h2></div><span aria-label={`${mastered} of 5 mastered`}>{mastered}/5</span></header>
          <ul className="can-do-list">{module.canDo.map((goal) => <li key={goal}>{goal}</li>)}</ul>
          <div className="section-row">
            {moduleSections.map((section) => {
              const state = progress[section.id]?.status ?? "not-started";
              return <Link className={`section-chip ${state}`} to={`/lesson/${section.id}`} key={section.id} aria-label={`Section ${section.number}, ${section.title}, ${state.replace("-", " ")}`}>
                <span>{section.day}</span><strong>{section.title.split(":")[0]}</strong><small>{state === "mastered" ? "mastered" : state === "in-progress" ? "in progress" : `${section.estimatedMinutes} min`}</small>
              </Link>;
            })}
          </div>
        </section>;
      })}
    </div>
  </div>;
}

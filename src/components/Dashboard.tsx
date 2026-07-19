import { Link } from "react-router-dom";
import type { Course, SectionProgress } from "../types";

export function Dashboard({ course, progress }: { course: Course; progress: Record<string, SectionProgress> }) {
  const mastered = Object.values(progress).filter((item) => item.status === "mastered").length;
  const started = Object.values(progress).filter((item) => item.status !== "not-started").length;
  const next = course.sections.find((section) => progress[section.id]?.status !== "mastered") ?? course.sections[0];
  const percent = Math.round((mastered / course.sections.length) * 100);
  const currentWeek = next.week;

  return <div className="page dashboard-page">
    <section className="hero" aria-labelledby="hero-title">
      <p className="eyebrow">OSAPHLA · 36-week Pan-Hispanic academy</p>
      <h1 id="hero-title">Train for useful Spanish, not a streak.</h1>
      <p>{course.description}</p>
      <div className="hero-actions"><Link className="button primary" to={`/lesson/${next.id}`}>{started ? "Continue training" : "Begin week one"}</Link><Link className="button" to="/course">Open course map</Link></div>
    </section>

    <section aria-labelledby="status-title">
      <div className="section-heading"><div><p className="eyebrow">Learning record</p><h2 id="status-title">Current status</h2></div><strong className="big-stat">{percent}%</strong></div>
      <div className="progress-track" role="progressbar" aria-label={`${mastered} of ${course.sections.length} sections mastered`} aria-valuemin={0} aria-valuemax={course.sections.length} aria-valuenow={mastered}><span style={{ width: `${percent}%` }} /></div>
      <div className="stat-grid">
        <article className="stat-card"><strong>{mastered}</strong><span>mastered</span></article>
        <article className="stat-card"><strong>{started}</strong><span>started</span></article>
        <article className="stat-card"><strong>{course.sections.length - mastered}</strong><span>remaining</span></article>
        <article className="stat-card"><strong>{course.readingAssignments.length}</strong><span>reading activities</span></article>
      </div>
    </section>

    <section aria-labelledby="now-title">
      <p className="eyebrow">Recommended next</p><h2 id="now-title">Week {currentWeek}: {course.modules[currentWeek - 1].title}</h2>
      <article className="next-card"><div><span className="badge">Section {next.number} · {next.level}</span><h3>{next.title}</h3><p>{next.objectives.join(" · ")}</p></div><Link className="button primary" to={`/lesson/${next.id}`}>Open section</Link></article>
    </section>

    <section className="principles" aria-labelledby="principles-title">
      <p className="eyebrow">The operating system</p><h2 id="principles-title">Every section follows the same complete loop</h2>
      <div className="feature-grid">
        <article><span>01</span><h3>Adaptive instruction</h3><p>Themeable semantic slides, local narration, captions, and a complete transcript.</p></article>
        <article><span>02</span><h3>Use the language</h3><p>Vocabulary, model sentences, reading or culture evidence, and a productive mission.</p></article>
        <article><span>03</span><h3>Prove retrieval</h3><p>Multiple choice, fill-in-the-blank, and ordering on every attempt.</p></article>
        <article><span>04</span><h3>Repair and repeat</h3><p>Explanatory feedback, an 85% mastery target, and no artificial lockouts.</p></article>
      </div>
    </section>
  </div>;
}

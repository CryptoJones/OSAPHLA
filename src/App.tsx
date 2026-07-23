import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import packageJson from "../package.json";
import spanishJson from "./data/es/course.json";
import englishJson from "./data/en/course.json";
import { CourseProvider, useCourse } from "./course";
import { courseProgress, exportLearningData, importLearningData } from "./lib/db";
import { useTheme } from "./theme";
import type { Course, SectionProgress } from "./types";
import { CourseMap } from "./components/CourseMap";
import { Dashboard } from "./components/Dashboard";
import { LessonPage } from "./components/LessonPage";
import { ReaderLibrary } from "./components/ReaderLibrary";
import { SettingsPage } from "./components/Settings";

const spanish = spanishJson as Course;
const english = englishJson as Course;

function CourseChooser({ force = false }: { force?: boolean }) {
  const { settings, update } = useTheme();
  useEffect(() => { document.documentElement.lang = "en"; }, []);
  if (settings.onboardingComplete && !force) return <Navigate to={`/${settings.selectedCourse ?? "es"}`} replace />;
  const destination = (slug: Course["slug"]) => settings.onboardingComplete ? `/${slug}` : `/${slug}/settings?welcome=1`;
  return <main className="course-chooser" id="main-content">
    <header>
      <p className="eyebrow">OSAPHLA</p>
      <h1 lang="en">What would you like to learn?</h1>
      <p lang="es">¿Qué te gustaría aprender?</p>
    </header>
    <div className="course-choice-grid">
      <Link className="course-choice" to={destination("en")} onClick={() => update({ selectedCourse: "en" })} aria-label="Learn English, Inglés para hispanohablantes">
        <span className="course-flags" aria-hidden="true">{english.flags.join(" ")}</span>
        <strong lang="es">Inglés</strong><span lang="es">Inglés para hispanohablantes</span>
      </Link>
      <Link className="course-choice" to={destination("es")} onClick={() => update({ selectedCourse: "es" })} aria-label="Aprender español, Spanish for English speakers">
        <span className="course-flags" aria-hidden="true">{spanish.flags.join(" ")}</span>
        <strong lang="en">Spanish</strong><span lang="en">Spanish for English speakers</span>
      </Link>
    </div>
  </main>;
}

function CourseMenu() {
  const { course, copy } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const menuRef = useRef<HTMLDetailsElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) { if (menuRef.current && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false; }
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, []);

  function closeMenu() { if (menuRef.current) menuRef.current.open = false; }

  async function saveProgress() {
    const data = await exportLearningData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `osaphla-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    setMessage(spanish ? "Copia de seguridad descargada." : "Backup downloaded.");
  }

  async function loadProgress(file: File) {
    await importLearningData(JSON.parse(await file.text()));
    setMessage(spanish ? "Copia restaurada. Se recargarán tus ajustes y tu progreso…" : "Backup restored. Reloading your saved settings and progress…");
    setTimeout(() => location.reload(), 700);
  }

  return <details className="course-menu" ref={menuRef}>
    <summary aria-label={copy.menu}><span className="course-menu-bars" aria-hidden="true"><span /><span /><span /></span></summary>
    <div className="course-menu-panel" role="menu">
      <Link role="menuitem" to="/choose" onClick={closeMenu}>{copy.switchCourse}</Link>
      <button role="menuitem" type="button" onClick={() => { closeMenu(); void saveProgress(); }}>{copy.saveProgress}</button>
      <button role="menuitem" type="button" onClick={() => { closeMenu(); fileRef.current?.click(); }}>{copy.loadProgress}</button>
      <input ref={fileRef} className="visually-hidden" type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadProgress(file).catch((error) => setMessage(spanish ? `No se pudo restaurar la copia. ${error instanceof Error ? error.message : "El archivo no es válido."}` : `Could not restore backup. ${error instanceof Error ? error.message : "The file is invalid."}`)); }} />
      {message && <p role="status" className="course-menu-status">{message}</p>}
    </div>
  </details>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { course, copy, path } = useCourse();
  return <div className="app-shell" data-course={course.slug}>
    <a className="skip-link" href="#main-content">{course.instructionLocale === "es-419" ? "Saltar al contenido de la lección" : "Skip to lesson content"}</a>
    <header className="site-header">
      <NavLink to={path()} className="brand" aria-label={`${course.title} ${copy.dashboard}`}><span>OSAPHLA <span className="version-tag">[{packageJson.version}]</span></span><small>{course.subtitle}</small></NavLink>
      <nav aria-label={course.instructionLocale === "es-419" ? "Navegación principal" : "Primary navigation"}>
        <NavLink to={path()} end>{copy.dashboard}</NavLink><NavLink to={path("course")}>{copy.course}</NavLink><NavLink to={path("readers")}>{copy.readers}</NavLink><NavLink to={path("settings")}>{copy.display}</NavLink>
      </nav>
      <CourseMenu />
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="site-footer">OSAPHLA · {copy.footer}</footer>
  </div>;
}

function CourseExperience({ course }: { course: Course }) {
  const { settings } = useTheme();
  const [progress, setProgress] = useState<Record<string, SectionProgress>>({});
  const refresh = async () => setProgress(Object.fromEntries((await courseProgress(course.slug)).map((item) => [item.sectionId, item])));
  useEffect(() => { setProgress({}); void refresh(); }, [course.slug]);
  useEffect(() => { document.documentElement.lang = course.instructionLocale === "es-419" ? "es" : "en"; }, [course.instructionLocale]);

  return <CourseProvider course={course}>
    {!settings.onboardingComplete
      ? <main id="main-content"><SettingsPage course={course} firstRun /></main>
      : <Layout><Routes>
        <Route index element={<Dashboard course={course} progress={progress} />} />
        <Route path="course" element={<CourseMap course={course} progress={progress} />} />
        <Route path="lesson/:sectionId" element={<LessonPage course={course} progress={progress} onProgress={refresh} />} />
        <Route path="readers" element={<ReaderLibrary course={course} />} />
        <Route path="settings" element={<SettingsPage course={course} />} />
        <Route path="*" element={<Navigate to={`/${course.slug}`} replace />} />
      </Routes></Layout>}
  </CourseProvider>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  // React Router (non-data-router API) does not restore scroll on navigation, so any
  // navigate() from a scrolled-down page (e.g. the onboarding "Save" button, several
  // screens tall) leaves the newly rendered page scrolled to wherever the old one was.
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

function LegacyLessonRedirect() {
  const { sectionId } = useParams();
  return <Navigate to={`/es/lesson/${sectionId ?? "w01-briefing"}`} replace />;
}

function LegacyRedirect({ destination }: { destination: string }) {
  const { search } = useLocation();
  return <Navigate to={`/es/${destination}${search}`} replace />;
}

export default function App() {
  const { ready } = useTheme();
  if (!ready) return <div className="loading" role="status"><span lang="en">Loading…</span><span aria-hidden="true"> / </span><span lang="es">Cargando…</span></div>;
  return <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}><ScrollToTop /><Routes>
    <Route path="/" element={<CourseChooser />} />
    <Route path="/choose" element={<CourseChooser force />} />
    <Route path="/es/*" element={<CourseExperience course={spanish} />} />
    <Route path="/en/*" element={<CourseExperience course={english} />} />
    <Route path="/lesson/:sectionId" element={<LegacyLessonRedirect />} />
    <Route path="/course" element={<LegacyRedirect destination="course" />} />
    <Route path="/readers" element={<LegacyRedirect destination="readers" />} />
    <Route path="/settings" element={<LegacyRedirect destination="settings" />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}

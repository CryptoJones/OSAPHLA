import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import courseJson from "./data/course.json";
import { db } from "./lib/db";
import { useTheme } from "./theme";
import type { Course, SectionProgress } from "./types";
import { CourseMap } from "./components/CourseMap";
import { Dashboard } from "./components/Dashboard";
import { LessonPage } from "./components/LessonPage";
import { ReaderLibrary } from "./components/ReaderLibrary";
import { SettingsPage, ThemeLab } from "./components/Settings";

const course = courseJson as Course;

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="site-header">
      <NavLink to="/" className="brand" aria-label="OSAPHLA dashboard"><span>OSAPHLA</span><small>Open Source Accessible Pan-Hispanic Language Academy</small></NavLink>
      <nav aria-label="Primary navigation">
        <NavLink to="/">Dashboard</NavLink><NavLink to="/course">Course</NavLink><NavLink to="/readers">Readers</NavLink><NavLink to="/settings">Display</NavLink>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="site-footer">OSAPHLA · Open source, private on-device learning · 36 weeks · 180 assessed sections · ILR preparation, not certification</footer>
  </div>;
}

export default function App() {
  const { settings, ready } = useTheme();
  const [progress, setProgress] = useState<Record<string, SectionProgress>>({});
  const refresh = async () => setProgress(Object.fromEntries((await db.progress.toArray()).map((item) => [item.sectionId, item])));
  useEffect(() => { void refresh(); }, []);
  if (!ready) return <div className="loading" role="status">Loading your visual settings…</div>;
  if (!settings.onboardingComplete) return <ThemeLab firstRun />;

  return <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}><Layout><Routes>
    <Route path="/" element={<Dashboard course={course} progress={progress} />} />
    <Route path="/course" element={<CourseMap course={course} progress={progress} />} />
    <Route path="/lesson/:sectionId" element={<LessonPage course={course} progress={progress} onProgress={refresh} />} />
    <Route path="/readers" element={<ReaderLibrary course={course} />} />
    <Route path="/settings" element={<SettingsPage course={course} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout></BrowserRouter>;
}

import { createContext, useContext, type ReactNode } from "react";
import type { Course } from "./types";

const COPY = {
  en: {
    dashboard: "Dashboard", course: "Course", readers: "Readers", display: "Display", switchCourse: "Choose another course",
    menu: "Menu", saveProgress: "Save Progress", loadProgress: "Load Progress",
    footer: "Open source, private on-device learning · 36 weeks · 180 assessed sections · ILR preparation, not certification",
    week: "Week", section: "Section", minutes: "minutes", courseMap: "Course map", englishMeaning: "English meaning", hear: "Hear",
    unavailableAudio: "Rendered pronunciation audio is not installed yet.", playing: (word: string) => `Playing ${word}.`
  },
  es: {
    dashboard: "Inicio", course: "Curso", readers: "Lecturas", display: "Pantalla", switchCourse: "Elegir otro curso",
    menu: "Menú", saveProgress: "Guardar progreso", loadProgress: "Cargar progreso",
    footer: "Aprendizaje abierto y privado en tu dispositivo · 36 semanas · 180 secciones evaluadas · preparación ILR, no certificación",
    week: "Semana", section: "Sección", minutes: "minutos", courseMap: "Mapa del curso", englishMeaning: "Significado en español", hear: "Escuchar",
    unavailableAudio: "El audio de pronunciación todavía no está instalado.", playing: (word: string) => `Reproduciendo ${word}.`
  }
} as const;

type CourseContextValue = { course: Course; copy: typeof COPY.en | typeof COPY.es; path: (suffix?: string) => string };
const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ course, children }: { course: Course; children: ReactNode }) {
  const copy = course.instructionLocale === "es-419" ? COPY.es : COPY.en;
  const path = (suffix = "") => `/${course.slug}${suffix ? `/${suffix.replace(/^\//, "")}` : ""}`;
  return <CourseContext.Provider value={{ course, copy, path }}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const value = useContext(CourseContext);
  if (!value) throw new Error("useCourse must be used inside CourseProvider");
  return value;
}

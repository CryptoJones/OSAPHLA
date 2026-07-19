import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultSettings, loadSettings, saveSettings } from "./lib/db";
import type { AccessibilitySettings } from "./types";

interface ThemeContextValue {
  settings: AccessibilitySettings;
  ready: boolean;
  update: (patch: Partial<AccessibilitySettings>) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.font = settings.font;
  root.dataset.density = settings.density;
  root.dataset.cursor = settings.cursor;
  root.dataset.decoration = settings.hideDecoration ? "hidden" : "visible";
  root.style.setProperty("--text-scale", `${settings.textScale / 100}`);
  root.style.setProperty("--font-weight", String(settings.fontWeight));
  root.style.setProperty("--line-height", String(settings.lineHeight));
  root.style.setProperty("--letter-spacing", `${settings.letterSpacing}em`);
  root.style.setProperty("--word-spacing", `${settings.wordSpacing}em`);
  root.style.setProperty("--reading-width", `${settings.readingWidth}ch`);
  root.style.setProperty("--focus-width", `${settings.focusWidth}px`);
  root.classList.toggle("reduce-motion", settings.reducedMotion);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings().then((value) => { setSettings(value); applySettings(value); setReady(true); });
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    settings,
    ready,
    update: (patch) => setSettings((current) => {
      const next = { ...current, ...patch };
      applySettings(next);
      void saveSettings(next);
      return next;
    }),
    reset: () => { setSettings(defaultSettings); applySettings(defaultSettings); void saveSettings(defaultSettings); }
  }), [settings, ready]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}

import { useRef, useState } from "react";
import { exportLearningData, importLearningData } from "../lib/db";
import { useTheme } from "../theme";
import type { Course, ThemeId } from "../types";

const themes: Array<{ id: ThemeId; name: string; note: string }> = [
  { id: "system", name: "System", note: "Follows light or dark system preference." },
  { id: "contrast-dark", name: "High contrast dark", note: "Near-black ground with bright text and strong borders." },
  { id: "contrast-light", name: "High contrast light", note: "White ground with near-black text and strong focus." },
  { id: "low-glare", name: "Low glare charcoal", note: "Muted contrast and restrained color for light sensitivity." },
  { id: "warm-paper", name: "Warm paper", note: "Warm low-blue background with dark brown text." },
  { id: "monochrome", name: "Monochrome", note: "No status depends on hue; shape and text carry meaning." },
  { id: "midnight-blue", name: "Midnight blue", note: "Deep navy with cool blue text accents and warm focus cues." },
  { id: "lavender-dusk", name: "Lavender dusk", note: "Soft violet dark mode with gentle, readable contrast." },
  { id: "ocean-light", name: "Ocean daylight", note: "Pale aqua surfaces with deep teal text and controls." },
  { id: "rose-clay", name: "Rose clay", note: "Muted rose-tinted paper with dark plum text." },
  { id: "amber-night", name: "Amber night", note: "Warm dark brown with cream text for reduced blue light." },
  { id: "slate-light", name: "Slate daylight", note: "Cool neutral gray with dark slate text and blue controls." },
  { id: "cream-ink", name: "Cream and ink", note: "Soft cream paper with dark blue-black text." },
  { id: "forest-night", name: "Forest night", note: "Deep forest green with pale neutral text." },
  { id: "burgundy-night", name: "Burgundy night", note: "Dark wine surfaces with pale rose-white text." },
  { id: "cobalt-light", name: "Cobalt daylight", note: "Cool blue-white paper with strong cobalt accents." },
  { id: "soft-gray", name: "Soft neutral gray", note: "Low-color light mode with restrained blue accents." },
  { id: "black-amber", name: "Black and amber", note: "True black with warm amber controls and cream text." },
  { id: "deep-ocean", name: "Deep ocean", note: "Near-black teal with clear cyan accents." },
  { id: "cyberdeck", name: "Cyberdeck", note: "Your approved blue-black terminal palette with neon cyan and green." },
  { id: "wcag-navy-coral", name: "WCAG navy and coral", note: "Light neutral ground with dark navy, blue, and burnt-orange cues." },
  { id: "wcag-blue-orange-dark", name: "WCAG blue and orange dark", note: "Blue-black ground with bright sky-blue and orange cues." },
  { id: "wcag-plum-apricot", name: "WCAG plum and apricot", note: "Warm light ground with dark plum and burnt-orange cues." },
  { id: "wcag-violet-cyan", name: "WCAG violet and cyan dark", note: "Deep violet ground with pale violet and cyan cues." }
];

function Controls() {
  const { settings, update } = useTheme();
  return <div className="display-controls">
    <fieldset><legend>Theme profiles</legend><div className="theme-grid">
      {themes.map((theme) => <label className={`theme-option theme-preview-${theme.id}`} key={theme.id}>
        <input type="radio" name="theme" checked={settings.theme === theme.id} onChange={() => update({ theme: theme.id })} />
        <span className="theme-swatch"><i /><i /><i /></span><strong>{theme.name}</strong><small>{theme.note}</small>
      </label>)}
    </div></fieldset>

    <div className="control-grid">
      <label>Font family<select value={settings.font} onChange={(event) => update({ font: event.target.value as typeof settings.font })}><option value="hyperlegible">Hyperlegible sans</option><option value="system">System sans</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></label>
      <label>Interface spacing<select value={settings.density} onChange={(event) => update({ density: event.target.value as typeof settings.density })}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
      <Slider label="Text size" value={settings.textScale} min={100} max={250} step={5} suffix="%" onChange={(textScale) => update({ textScale })} />
      <Slider label="Font weight" value={settings.fontWeight} min={400} max={800} step={50} onChange={(fontWeight) => update({ fontWeight })} />
      <Slider label="Line height" value={settings.lineHeight} min={1.3} max={2.2} step={0.05} onChange={(lineHeight) => update({ lineHeight })} />
      <Slider label="Reading width" value={settings.readingWidth} min={40} max={90} step={2} suffix=" characters" onChange={(readingWidth) => update({ readingWidth })} />
      <Slider label="Letter spacing" value={settings.letterSpacing} min={0} max={0.15} step={0.01} suffix=" em" onChange={(letterSpacing) => update({ letterSpacing })} />
      <Slider label="Word spacing" value={settings.wordSpacing} min={0} max={0.3} step={0.02} suffix=" em" onChange={(wordSpacing) => update({ wordSpacing })} />
      <Slider label="Focus outline" value={settings.focusWidth} min={2} max={8} step={1} suffix=" px" onChange={(focusWidth) => update({ focusWidth })} />
      <label>Pointer size<select value={settings.cursor} onChange={(event) => update({ cursor: event.target.value as typeof settings.cursor })}><option value="standard">Standard</option><option value="large">Large</option></select></label>
    </div>
    <div className="toggle-grid">
      <label><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /> Reduce all nonessential motion</label>
      <label><input type="checkbox" checked={settings.hideDecoration} onChange={(event) => update({ hideDecoration: event.target.checked })} /> Remove decorative effects</label>
    </div>
  </div>;
}

function Slider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label>{label}: <output>{value}{suffix}</output><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function SampleLesson() {
  return <article className="comfort-sample" aria-labelledby="sample-title">
    <p className="eyebrow">Live comfort sample · Week 5</p><h2 id="sample-title">Location, condition, and existence</h2>
    <p><strong>Objective:</strong> locate a service and distinguish what exists from where it is.</p>
    <div className="sample-callout" lang="es">Hay una farmacia cerca. La farmacia está abierta, pero el banco está cerrado.</div>
    <p className="english-meaning"><strong>English meaning:</strong> There is a pharmacy nearby. The pharmacy is open, but the bank is closed.</p>
    <p><em>Hay</em> introduces something that exists. <em>Está</em> locates or describes the condition of a known thing.</p>
    <div className="sample-buttons"><button type="button">Primary action</button><button type="button">Secondary action</button></div>
  </article>;
}

export function ThemeLab({ firstRun = false }: { firstRun?: boolean }) {
  const { update } = useTheme();
  return <div className={firstRun ? "onboarding" : "page"}>
    <header className="page-title"><p className="eyebrow">Visual comfort lab</p><h1>Make the course fit your vision.</h1><p>There is no correct theme. Compare real content, change one control at a time, and return whenever your needs or environment change.</p></header>
    <div className="comfort-layout"><Controls /><SampleLesson /></div>
    {firstRun && <div className="onboarding-action"><button className="button primary" type="button" onClick={() => update({ onboardingComplete: true })}>Use these settings and enter the academy</button><p>Your selection is stored only in this browser.</p></div>}
  </div>;
}

export function SettingsPage({ course }: { course: Course }) {
  const { reset } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);

  async function downloadBackup() {
    const data = await exportLearningData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `espanol-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
  }

  async function restore(file: File) {
    await importLearningData(JSON.parse(await file.text()));
    setMessage("Backup restored. Reloading your saved settings and progress…");
    setTimeout(() => location.reload(), 700);
  }

  async function installMedia() {
    if (!("caches" in window)) { setMediaMessage("This browser does not expose offline media storage."); return; }
    setMediaBusy(true);
    const urls = course.sections.flatMap((section) => [section.media.video, section.media.audio]);
    try {
      await navigator.storage?.persist?.();
      const cache = await caches.open("espanol-media-v2");
      for (let index = 0; index < urls.length; index += 1) {
        const request = new Request(new URL(urls[index], location.origin), { credentials: "same-origin" });
        if (!await cache.match(request)) {
          const response = await fetch(request);
          if (!response.ok) throw new Error(`Media pack stopped at ${urls[index]} (${response.status}).`);
          await cache.put(request, response);
        }
        setMediaMessage(`Installed ${index + 1} of ${urls.length} offline media files…`);
      }
      setMediaMessage(`Complete offline media pack installed: ${urls.length} files.`);
    } catch (error) { setMediaMessage(error instanceof Error ? error.message : "Media installation failed."); }
    finally { setMediaBusy(false); }
  }

  async function removeMedia() {
    if (!("caches" in window)) { setMediaMessage("This browser does not expose offline media storage."); return; }
    await caches.delete("espanol-media-v2");
    setMediaMessage("Downloaded audio and video removed. Course progress was not changed.");
  }

  return <div className="page"><ThemeLab />
    <section className="data-tools" aria-labelledby="offline-title"><p className="eyebrow">Offline installation</p><h2 id="offline-title">Audio and video media pack</h2><p>The course shell and written lessons work offline automatically. Install all 180 videos and matching narration files for complete offline media access; browser storage use is roughly 300 MiB.</p>
      <div className="button-row"><button className="button primary" disabled={mediaBusy} onClick={() => void installMedia()}>{mediaBusy ? "Installing media…" : "Install complete media pack"}</button><button className="button danger" disabled={mediaBusy} onClick={() => void removeMedia()}>Remove downloaded media</button></div>
      <p role="status" aria-live="polite">{mediaMessage}</p>
    </section>
    <section className="data-tools" aria-labelledby="data-title"><p className="eyebrow">On-device records</p><h2 id="data-title">Backup and portability</h2><p>Progress, attempts, review scheduling, and display settings stay in IndexedDB. Microphone recordings are deliberately excluded from export.</p>
      <div className="button-row"><button className="button" onClick={() => void downloadBackup()}>Download JSON backup</button><button className="button" onClick={() => fileRef.current?.click()}>Restore backup</button><button className="button danger" onClick={reset}>Reset display settings</button></div>
      <input ref={fileRef} className="visually-hidden" type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restore(file).catch((error) => setMessage(error.message)); }} />
      <p role="status">{message}</p>
    </section>
  </div>;
}

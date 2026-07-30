import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourse } from "../course";
import { exportLearningData, importLearningData } from "../lib/db";
import { mediaUrl } from "../lib/media";
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

const themeSpanish: Record<ThemeId, { name: string; note: string }> = {
  system: { name: "Sistema", note: "Sigue la preferencia clara u oscura del sistema." },
  "contrast-dark": { name: "Oscuro de alto contraste", note: "Fondo casi negro, texto brillante y bordes fuertes." },
  "contrast-light": { name: "Claro de alto contraste", note: "Fondo blanco, texto casi negro y enfoque fuerte." },
  "low-glare": { name: "Carbón de bajo resplandor", note: "Contraste moderado y poco color para la sensibilidad a la luz." },
  "warm-paper": { name: "Papel cálido", note: "Fondo cálido con poca luz azul y texto marrón oscuro." },
  monochrome: { name: "Monocromo", note: "El significado depende de formas y texto, no del color." },
  "midnight-blue": { name: "Azul medianoche", note: "Azul marino profundo con acentos fríos y enfoque cálido." },
  "lavender-dusk": { name: "Lavanda al anochecer", note: "Modo violeta oscuro, suave y legible." },
  "ocean-light": { name: "Océano claro", note: "Superficies aguamarina pálidas con texto verde azulado." },
  "rose-clay": { name: "Arcilla rosada", note: "Papel rosado apagado con texto ciruela oscuro." },
  "amber-night": { name: "Noche ámbar", note: "Marrón oscuro cálido con texto crema y poca luz azul." },
  "slate-light": { name: "Pizarra clara", note: "Gris neutro frío con texto oscuro y controles azules." },
  "cream-ink": { name: "Crema y tinta", note: "Papel crema suave con texto azul casi negro." },
  "forest-night": { name: "Bosque nocturno", note: "Verde bosque profundo con texto neutro pálido." },
  "burgundy-night": { name: "Noche borgoña", note: "Superficies vino oscuro con texto rosa pálido." },
  "cobalt-light": { name: "Cobalto claro", note: "Papel blanco azulado con acentos cobalto fuertes." },
  "soft-gray": { name: "Gris neutro suave", note: "Modo claro con poco color y acentos azules moderados." },
  "black-amber": { name: "Negro y ámbar", note: "Negro puro con controles ámbar y texto crema." },
  "deep-ocean": { name: "Océano profundo", note: "Verde azulado casi negro con acentos cian claros." },
  cyberdeck: { name: "Cyberdeck", note: "Paleta de terminal azul-negro con cian y verde neón." },
  "wcag-navy-coral": { name: "WCAG marino y coral", note: "Fondo neutro claro con azul marino y naranja quemado." },
  "wcag-blue-orange-dark": { name: "WCAG azul y naranja oscuro", note: "Fondo azul-negro con señales celestes y naranjas." },
  "wcag-plum-apricot": { name: "WCAG ciruela y albaricoque", note: "Fondo cálido claro con ciruela y naranja quemado." },
  "wcag-violet-cyan": { name: "WCAG violeta y cian oscuro", note: "Fondo violeta profundo con señales violetas y cian." }
};

function Controls() {
  const { course } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const { settings, update } = useTheme();
  return <div className="display-controls">
    <fieldset><legend>{spanish ? "Perfiles de tema" : "Theme profiles"}</legend><div className="theme-grid">
      {themes.map((theme) => <label className={`theme-option theme-preview-${theme.id}`} key={theme.id}>
        <input type="radio" name="theme" checked={settings.theme === theme.id} onChange={() => update({ theme: theme.id })} />
        <span className="theme-swatch"><i /><i /><i /></span><strong>{spanish ? themeSpanish[theme.id].name : theme.name}</strong><small>{spanish ? themeSpanish[theme.id].note : theme.note}</small>
      </label>)}
    </div></fieldset>

    <div className="control-grid">
      <label>{spanish ? "Familia tipográfica" : "Font family"}<select value={settings.font} onChange={(event) => update({ font: event.target.value as typeof settings.font })}><option value="hyperlegible">{spanish ? "Sans hiperlegible" : "Hyperlegible sans"}</option><option value="system">{spanish ? "Sans del sistema" : "System sans"}</option><option value="serif">{spanish ? "Con serif" : "Serif"}</option><option value="mono">{spanish ? "Monoespaciada" : "Monospace"}</option></select></label>
      <label>{spanish ? "Espaciado de interfaz" : "Interface spacing"}<select value={settings.density} onChange={(event) => update({ density: event.target.value as typeof settings.density })}><option value="comfortable">{spanish ? "Cómodo" : "Comfortable"}</option><option value="compact">{spanish ? "Compacto" : "Compact"}</option></select></label>
      <Slider label={spanish ? "Tamaño del texto" : "Text size"} value={settings.textScale} min={100} max={250} step={5} suffix="%" onChange={(textScale) => update({ textScale })} />
      <Slider label={spanish ? "Peso de fuente" : "Font weight"} value={settings.fontWeight} min={400} max={800} step={50} onChange={(fontWeight) => update({ fontWeight })} />
      <Slider label={spanish ? "Altura de línea" : "Line height"} value={settings.lineHeight} min={1.3} max={2.2} step={0.05} onChange={(lineHeight) => update({ lineHeight })} />
      <Slider label={spanish ? "Ancho de lectura" : "Reading width"} value={settings.readingWidth} min={40} max={90} step={2} suffix={spanish ? " caracteres" : " characters"} onChange={(readingWidth) => update({ readingWidth })} />
      <Slider label={spanish ? "Espaciado entre letras" : "Letter spacing"} value={settings.letterSpacing} min={0} max={0.15} step={0.01} suffix=" em" onChange={(letterSpacing) => update({ letterSpacing })} />
      <Slider label={spanish ? "Espaciado entre palabras" : "Word spacing"} value={settings.wordSpacing} min={0} max={0.3} step={0.02} suffix=" em" onChange={(wordSpacing) => update({ wordSpacing })} />
      <Slider label={spanish ? "Contorno de enfoque" : "Focus outline"} value={settings.focusWidth} min={2} max={8} step={1} suffix=" px" onChange={(focusWidth) => update({ focusWidth })} />
      <label>{spanish ? "Tamaño del puntero" : "Pointer size"}<select value={settings.cursor} onChange={(event) => update({ cursor: event.target.value as typeof settings.cursor })}><option value="standard">{spanish ? "Estándar" : "Standard"}</option><option value="large">{spanish ? "Grande" : "Large"}</option></select></label>
    </div>
    <div className="toggle-grid">
      <label><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /> {spanish ? "Reducir todo movimiento no esencial" : "Reduce all nonessential motion"}</label>
      <label><input type="checkbox" checked={settings.hideDecoration} onChange={(event) => update({ hideDecoration: event.target.checked })} /> {spanish ? "Eliminar efectos decorativos" : "Remove decorative effects"}</label>
    </div>
  </div>;
}

function Slider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label>{label}: <output>{value}{suffix}</output><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function SampleLesson() {
  const { course } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  return <article className="comfort-sample" aria-labelledby="sample-title">
    <p className="eyebrow">{spanish ? "Muestra de comodidad · Semana 5" : "Live comfort sample · Week 5"}</p><h2 id="sample-title">{spanish ? "Lugar, existencia y preposiciones" : "Location, condition, and existence"}</h2>
    <p><strong>{spanish ? "Objetivo:" : "Objective:"}</strong> {spanish ? "ubicar un servicio y distinguir existencia de ubicación." : "locate a service and distinguish what exists from where it is."}</p>
    <div className="sample-callout" lang={spanish ? "en" : "es"}>{spanish ? "There is a pharmacy nearby. The pharmacy is open, but the bank is closed." : "Hay una farmacia cerca. La farmacia está abierta, pero el banco está cerrado."}</div>
    <p className="english-meaning"><strong>{spanish ? "Significado en español:" : "English meaning:"}</strong> {spanish ? "Hay una farmacia cerca. La farmacia está abierta, pero el banco está cerrado." : "There is a pharmacy nearby. The pharmacy is open, but the bank is closed."}</p>
    <p>{spanish ? <><em>There is</em> presenta algo que existe. <em>Is</em> ubica o describe el estado de algo conocido.</> : <><em>Hay</em> introduces something that exists. <em>Está</em> locates or describes the condition of a known thing.</>}</p>
    <div className="sample-buttons"><button type="button">{spanish ? "Acción principal" : "Primary action"}</button><button type="button">{spanish ? "Acción secundaria" : "Secondary action"}</button></div>
  </article>;
}

export function ThemeLab({ firstRun = false }: { firstRun?: boolean }) {
  const { course, path } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const { update } = useTheme();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(firstRun);
  const welcomeRef = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = welcomeRef.current;
    if (showWelcome && dialog && !dialog.open) dialog.showModal();
  }, [showWelcome]);
  return <div className={firstRun ? "onboarding" : "page"}>
    {showWelcome && <dialog ref={welcomeRef} className="onboarding-dialog" aria-labelledby="onboarding-message" onCancel={() => setShowWelcome(false)}><p id="onboarding-message">{spanish ? "Selecciona tus ajustes de pantalla preferidos, desplázate hasta el final y haz clic en «Guardar» para comenzar el curso." : "Select your preferred Display Settings, Scroll to the bottom and click 'Save' to start the course."}</p><button className="button primary" onClick={() => setShowWelcome(false)}>{spanish ? "Continuar" : "Continue"}</button></dialog>}
    <header className="page-title"><p className="eyebrow">{spanish ? "Laboratorio de comodidad visual" : "Visual comfort lab"}</p><h1>{spanish ? "Adapta el curso a tu visión." : "Make the course fit your vision."}</h1><p>{spanish ? "No existe un tema correcto. Compara contenido real, cambia un control a la vez y vuelve cuando cambien tus necesidades o tu entorno." : "There is no correct theme. Compare real content, change one control at a time, and return whenever your needs or environment change."}</p></header>
    <div className="comfort-layout"><Controls /><SampleLesson /></div>
    {firstRun && <div className="onboarding-action"><button className="button primary" type="button" onClick={() => { update({ onboardingComplete: true, selectedCourse: course.slug }); navigate(path()); }}>{spanish ? "Guardar" : "Save"}</button><p>{spanish ? "Tu selección se guarda únicamente en este navegador." : "Your selection is stored only in this browser."}</p></div>}
  </div>;
}

export function SettingsPage({ course, firstRun = false }: { course: Course; firstRun?: boolean }) {
  if (firstRun) return <ThemeLab firstRun />;
  const spanish = course.instructionLocale === "es-419";
  const { reset } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);

  async function downloadBackup() {
    const data = await exportLearningData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `osaphla-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    setMessage(spanish ? "Copia de seguridad descargada." : "Backup downloaded.");
  }

  async function restore(file: File) {
    await importLearningData(JSON.parse(await file.text()));
    setMessage(spanish ? "Copia restaurada. Se recargarán tus ajustes y tu progreso…" : "Backup restored. Reloading your saved settings and progress…");
    setTimeout(() => location.reload(), 700);
  }

  async function installMedia() {
    if (!("caches" in window)) { setMediaMessage(spanish ? "Este navegador no ofrece almacenamiento multimedia sin conexión." : "This browser does not expose offline media storage."); return; }
    setMediaBusy(true);
    const urls = course.sections.flatMap((section) => [mediaUrl(section.media.video), mediaUrl(section.media.audio)]);
    try {
      await navigator.storage?.persist?.();
      const cache = await caches.open("osaphla-media-v3");
      for (let index = 0; index < urls.length; index += 1) {
        const request = new Request(new URL(urls[index], location.origin), { credentials: "same-origin" });
        if (!await cache.match(request)) {
          const response = await fetch(request);
          if (!response.ok) throw new Error(`${spanish ? "La instalación se detuvo en" : "Media pack stopped at"} ${urls[index]} (${response.status}).`);
          await cache.put(request, response);
        }
        setMediaMessage(spanish ? `Se instalaron ${index + 1} de ${urls.length} archivos multimedia…` : `Installed ${index + 1} of ${urls.length} offline media files…`);
      }
      setMediaMessage(spanish ? `Paquete multimedia completo instalado: ${urls.length} archivos.` : `Complete offline media pack installed: ${urls.length} files.`);
    } catch (error) { setMediaMessage(error instanceof Error ? error.message : (spanish ? "Falló la instalación multimedia." : "Media installation failed.")); }
    finally { setMediaBusy(false); }
  }

  async function removeMedia() {
    if (!("caches" in window)) { setMediaMessage(spanish ? "Este navegador no ofrece almacenamiento multimedia sin conexión." : "This browser does not expose offline media storage."); return; }
    const cache = await caches.open("osaphla-media-v3");
    const coursePath = `/media/${course.slug}/`;
    await Promise.all((await cache.keys()).filter((request) => new URL(request.url).pathname.includes(coursePath)).map((request) => cache.delete(request)));
    setMediaMessage(spanish ? "Se eliminaron el audio y el video descargados. El progreso no cambió." : "Downloaded audio and video removed. Course progress was not changed.");
  }

  return <div className="page"><ThemeLab />
    <section className="data-tools" aria-labelledby="offline-title"><p className="eyebrow">{spanish ? "Instalación sin conexión" : "Offline installation"}</p><h2 id="offline-title">{spanish ? "Paquete de audio y video" : "Audio and video media pack"}</h2><p>{spanish ? "La aplicación y las lecciones escritas funcionan sin conexión automáticamente. Instala los 180 videos y sus narraciones para tener acceso multimedia completo; se requieren aproximadamente 1,3 GiB de almacenamiento." : "The course shell and written lessons work offline automatically. Install all 180 videos and matching narration files for complete offline media access; browser storage use is roughly 1.3 GiB."}</p>
      <div className="button-row"><button className="button primary" disabled={mediaBusy} onClick={() => void installMedia()}>{mediaBusy ? (spanish ? "Instalando…" : "Installing media…") : (spanish ? "Instalar el paquete completo" : "Install complete media pack")}</button><button className="button danger" disabled={mediaBusy} onClick={() => void removeMedia()}>{spanish ? "Eliminar archivos descargados" : "Remove downloaded media"}</button></div>
      <p role="status" aria-live="polite">{mediaMessage}</p>
    </section>
    <section className="data-tools" aria-labelledby="data-title"><p className="eyebrow">{spanish ? "Registros en el dispositivo" : "On-device records"}</p><h2 id="data-title">{spanish ? "Copia de seguridad y portabilidad" : "Backup and portability"}</h2><p>{spanish ? "El progreso, los intentos, el repaso y los ajustes permanecen en IndexedDB. Las grabaciones del micrófono no se exportan." : "Progress, attempts, review scheduling, and display settings stay in IndexedDB. Microphone recordings are deliberately excluded from export."}</p>
      <div className="button-row"><button className="button" onClick={() => void downloadBackup()}>{spanish ? "Descargar copia JSON" : "Download JSON backup"}</button><button className="button" onClick={() => fileRef.current?.click()}>{spanish ? "Restaurar copia" : "Restore backup"}</button><button className="button danger" onClick={reset}>{spanish ? "Restablecer ajustes" : "Reset display settings"}</button></div>
      <input ref={fileRef} className="visually-hidden" type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restore(file).catch((error) => setMessage(spanish ? `No se pudo restaurar la copia. Tus datos actuales no cambiaron. ${error instanceof Error ? error.message : "El archivo no es válido."}` : `Could not restore backup. Your existing data was not changed. ${error instanceof Error ? error.message : "The file is invalid."}`)); }} />
      <p role="status">{message}</p>
    </section>
  </div>;
}

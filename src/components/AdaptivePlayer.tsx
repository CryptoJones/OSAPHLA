import { useEffect, useRef, useState } from "react";
import { useCourse } from "../course";
import type { Section } from "../types";
import { mediaUrl } from "../lib/media";

type Mode = "adaptive" | "video" | "transcript";
const modes: Mode[] = ["adaptive", "video", "transcript"];

async function cacheForOffline(paths: string[]) {
  if (!("caches" in window) || !navigator.onLine) return;
  try {
    const cache = await caches.open("osaphla-media-v3");
    await Promise.all(paths.map(async (path) => {
      const request = new Request(new URL(path, location.origin), { credentials: "same-origin" });
      if (await cache.match(request)) return;
      const response = await fetch(request);
      if (response.ok && response.status === 200) await cache.put(request, response);
    }));
  } catch { /* playback still works online when background caching is unavailable */ }
}

export function AdaptivePlayer({ section }: { section: Section }) {
  const { course } = useCourse();
  const spanish = course.instructionLocale === "es-419";
  const [mode, setMode] = useState<Mode>("adaptive");
  const [slideIndex, setSlideIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mediaAvailable, setMediaAvailable] = useState(true);
  const [adaptiveAudioAvailable, setAdaptiveAudioAvailable] = useState(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  const modeTabs = useRef<Array<HTMLButtonElement | null>>([]);
  const slide = section.slides[slideIndex];
  const targetLang = course.targetLocale.slice(0, 2);
  const instructionLang = course.instructionLocale.slice(0, 2);

  function slideText(line: string) {
    const bilingual = line.split(" — ");
    if (bilingual.length === 2) return <><span lang={targetLang}>{bilingual[0]}</span><span aria-hidden="true"> — </span><span lang={instructionLang}>{bilingual[1]}</span></>;
    return <span lang={line === section.reading || section.modelSentences.includes(line) ? targetLang : instructionLang}>{line}</span>;
  }

  useEffect(() => () => { audio.current?.pause(); }, []);
  useEffect(() => { audio.current?.pause(); audio.current = null; setSlideIndex(0); setPlaying(false); setMode("adaptive"); setMediaAvailable(true); setAdaptiveAudioAvailable(true); }, [section.id, course.slug]);

  function stop() {
    setPlaying(false);
    audio.current?.pause();
    audio.current = null;
  }

  function go(index: number) {
    stop(); setSlideIndex(Math.max(0, Math.min(section.slides.length - 1, index)));
  }

  function playCurrent() {
    setPlaying(true);
    const advance = () => {
      if (slideIndex < section.slides.length - 1) { setSlideIndex((value) => value + 1); }
      else stop();
    };
    const narration = new Audio(mediaUrl(`media/${course.slug}/${section.id}/slides/${String(slideIndex).padStart(2, "0")}.mp3`));
    audio.current?.pause();
    audio.current = narration;
    narration.preload = "auto";
    narration.onended = advance;
    narration.onerror = () => { setPlaying(false); setAdaptiveAudioAvailable(false); audio.current = null; };
    void narration.play().catch(() => { setPlaying(false); setAdaptiveAudioAvailable(false); audio.current = null; });
  }

  function chooseMode(nextMode: Mode) {
    stop();
    setMode(nextMode);
    if (nextMode === "video") void cacheForOffline([mediaUrl(section.media.video), mediaUrl(section.media.audio)]);
  }

  function moveModeFocus(current: number, direction: -1 | 1) {
    const next = (current + direction + modes.length) % modes.length;
    chooseMode(modes[next]);
    modeTabs.current[next]?.focus();
  }

  useEffect(() => { if (playing) playCurrent(); /* new slide continues playback */ }, [slideIndex]);

  return <section className="adaptive-player" aria-labelledby="instruction-title">
    <header className="player-header"><div><p className="eyebrow">{spanish ? "Instrucción" : "Instruction"}</p><h2 id="instruction-title">{spanish ? "Presentación adaptable de la lección" : "Adaptive lesson presentation"}</h2></div>
      <div className="mode-tabs" role="tablist" aria-label={spanish ? "Formato de instrucción" : "Instruction format"} aria-orientation="horizontal">
        {modes.map((item, index) => <button ref={(node) => { modeTabs.current[index] = node; }} id={`instruction-tab-${item}`} key={item} type="button" role="tab" aria-selected={mode === item} aria-controls={`instruction-panel-${item}`} tabIndex={mode === item ? 0 : -1} onClick={() => chooseMode(item)} onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); moveModeFocus(index, -1); }
          if (event.key === "ArrowRight") { event.preventDefault(); moveModeFocus(index, 1); }
          if (event.key === "Home") { event.preventDefault(); chooseMode(modes[0]); modeTabs.current[0]?.focus(); }
          if (event.key === "End") { event.preventDefault(); chooseMode(modes[modes.length - 1]); modeTabs.current[modes.length - 1]?.focus(); }
        }}>{item === "adaptive" ? (spanish ? "Diapositivas" : "Adaptive slides") : item === "video" ? (spanish ? "Video MP4" : "MP4 video") : (spanish ? "Transcripción" : "Transcript")}</button>)}
      </div>
    </header>
    {mode === "adaptive" && <div className="slide-stage" id="instruction-panel-adaptive" role="tabpanel" aria-labelledby="instruction-tab-adaptive">
      <div role="group" aria-roledescription={spanish ? "diapositiva narrada adaptable" : "themeable narrated slide"} aria-label={spanish ? `Diapositiva ${slideIndex + 1} de ${section.slides.length}: ${slide.title}` : `Slide ${slideIndex + 1} of ${section.slides.length}: ${slide.title}`}>
      <div className="slide-counter">{String(slideIndex + 1).padStart(2,"0")} / {String(section.slides.length).padStart(2,"0")}</div>
      {slide.kicker && <p className="eyebrow">{slide.kicker}</p>}<h3>{slide.title}</h3>
      {slide.body.length > 1 ? <ul>{slide.body.map((line) => <li key={line}>{slideText(line)}</li>)}</ul> : <p>{slideText(slide.body[0])}</p>}
      <div className="player-controls">
        <button type="button" onClick={() => go(slideIndex - 1)} disabled={slideIndex === 0} aria-label={spanish ? "Diapositiva anterior" : "Previous slide"}>← {spanish ? "Anterior" : "Previous"}</button>
        <button className="play" type="button" onClick={playing ? stop : playCurrent} aria-pressed={playing}>{playing ? (spanish ? "Pausar narración" : "Pause narration") : (spanish ? "Reproducir narración" : "Play narration")}</button>
        <button type="button" onClick={() => go(slideIndex + 1)} disabled={slideIndex === section.slides.length - 1} aria-label={spanish ? "Diapositiva siguiente" : "Next slide"}>{spanish ? "Siguiente" : "Next"} →</button>
      </div>
      {!adaptiveAudioAvailable && <p role="status" className="media-notice">{spanish ? "La narración todavía no está instalada para esta diapositiva. Usa el video MP4 mientras termina la instalación." : "Rendered narration is not installed for this slide yet. Use the MP4 lesson while media installation completes."}</p>}
      <div className="slide-dots" aria-label={spanish ? "Elegir diapositiva" : "Choose slide"}>{section.slides.map((item, index) => <button key={`${item.title}-${index}`} type="button" className={index === slideIndex ? "active" : ""} aria-label={spanish ? `Diapositiva ${index + 1}: ${item.title}` : `Slide ${index + 1}: ${item.title}`} aria-current={index === slideIndex ? "step" : undefined} onClick={() => go(index)} />)}</div>
      </div>
    </div>}
    {mode === "video" && <div className="video-stage" id="instruction-panel-video" role="tabpanel" aria-labelledby="instruction-tab-video">
      {mediaAvailable ? <video controls playsInline preload="metadata" onError={() => setMediaAvailable(false)}><source src={mediaUrl(section.media.video)} type="video/mp4" /><track kind="captions" src={mediaUrl(section.media.captions)} srcLang="mul" label={spanish ? "Subtítulos descriptivos bilingües" : "Bilingual descriptive captions"} default /></video> : <div className="media-fallback"><h3>{spanish ? "El MP4 todavía no está instalado." : "Rendered MP4 is not installed yet."}</h3><p>{spanish ? "La presentación adaptable contiene toda la instrucción y funciona con cada tema visual." : "The adaptive presentation above contains the complete instruction and works with every visual theme. Run the local media renderer to install MP4 copies."}</p><button type="button" onClick={() => setMode("adaptive")}>{spanish ? "Usar presentación adaptable" : "Use adaptive presentation"}</button></div>}
    </div>}
    {mode === "transcript" && <article className="transcript" id="instruction-panel-transcript" role="tabpanel" aria-labelledby="instruction-tab-transcript"><h3>{spanish ? "Transcripción descriptiva" : "Descriptive transcript"}</h3>{section.media.transcript.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>}
  </section>;
}

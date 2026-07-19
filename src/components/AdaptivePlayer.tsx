import { useEffect, useRef, useState } from "react";
import type { Section } from "../types";
import { mediaUrl } from "../lib/media";

type Mode = "adaptive" | "video" | "transcript";

async function cacheForOffline(paths: string[]) {
  if (!("caches" in window) || !navigator.onLine) return;
  try {
    const cache = await caches.open("espanol-media-v2");
    await Promise.all(paths.map(async (path) => {
      const request = new Request(new URL(path, location.origin), { credentials: "same-origin" });
      if (await cache.match(request)) return;
      const response = await fetch(request);
      if (response.ok && response.status === 200) await cache.put(request, response);
    }));
  } catch { /* playback still works online when background caching is unavailable */ }
}

export function AdaptivePlayer({ section }: { section: Section }) {
  const [mode, setMode] = useState<Mode>("adaptive");
  const [slideIndex, setSlideIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mediaAvailable, setMediaAvailable] = useState(true);
  const [adaptiveAudioAvailable, setAdaptiveAudioAvailable] = useState(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  const slide = section.slides[slideIndex];

  useEffect(() => () => { audio.current?.pause(); }, []);
  useEffect(() => { audio.current?.pause(); audio.current = null; setSlideIndex(0); setPlaying(false); setMode("adaptive"); setAdaptiveAudioAvailable(true); }, [section.id]);

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
    const narration = new Audio(mediaUrl(`media/${section.id}/slides/${String(slideIndex).padStart(2, "0")}.mp3`));
    audio.current?.pause();
    audio.current = narration;
    narration.preload = "auto";
    narration.onended = advance;
    narration.onerror = () => { setPlaying(false); setAdaptiveAudioAvailable(false); audio.current = null; };
    void narration.play().catch(() => { setPlaying(false); setAdaptiveAudioAvailable(false); audio.current = null; });
  }

  useEffect(() => { if (playing) playCurrent(); /* new slide continues playback */ }, [slideIndex]);

  return <section className="adaptive-player" aria-labelledby="instruction-title">
    <header className="player-header"><div><p className="eyebrow">Instruction</p><h2 id="instruction-title">Adaptive lesson presentation</h2></div>
      <div className="mode-tabs" role="tablist" aria-label="Instruction format">
        {(["adaptive","video","transcript"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => { stop(); setMode(item); if (item === "video") void cacheForOffline([mediaUrl(section.media.video), mediaUrl(section.media.audio)]); }}>{item === "adaptive" ? "Adaptive slides" : item === "video" ? "MP4 video" : "Transcript"}</button>)}
      </div>
    </header>
    {mode === "adaptive" && <div className="slide-stage" role="group" aria-roledescription="themeable narrated slide" aria-label={`Slide ${slideIndex + 1} of ${section.slides.length}: ${slide.title}`}>
      <div className="slide-counter">{String(slideIndex + 1).padStart(2,"0")} / {String(section.slides.length).padStart(2,"0")}</div>
      {slide.kicker && <p className="eyebrow">{slide.kicker}</p>}<h3>{slide.title}</h3>
      {slide.body.length > 1 ? <ul>{slide.body.map((line) => <li key={line}>{line}</li>)}</ul> : <p>{slide.body[0]}</p>}
      <div className="player-controls">
        <button type="button" onClick={() => go(slideIndex - 1)} disabled={slideIndex === 0} aria-label="Previous slide">← Previous</button>
        <button className="play" type="button" onClick={playing ? stop : playCurrent} aria-pressed={playing}>{playing ? "Pause narration" : "Play narration"}</button>
        <button type="button" onClick={() => go(slideIndex + 1)} disabled={slideIndex === section.slides.length - 1} aria-label="Next slide">Next →</button>
      </div>
      {!adaptiveAudioAvailable && <p role="status" className="media-notice">Rendered narration is not installed for this slide yet. Use the MP4 lesson while media installation completes.</p>}
      <div className="slide-dots" aria-label="Choose slide">{section.slides.map((item, index) => <button key={`${item.title}-${index}`} type="button" className={index === slideIndex ? "active" : ""} aria-label={`Slide ${index + 1}: ${item.title}`} aria-current={index === slideIndex ? "step" : undefined} onClick={() => go(index)} />)}</div>
    </div>}
    {mode === "video" && <div className="video-stage">
      {mediaAvailable ? <video controls playsInline preload="metadata" onError={() => setMediaAvailable(false)}><source src={mediaUrl(section.media.video)} type="video/mp4" /><track kind="captions" src={mediaUrl(section.media.captions)} srcLang="mul" label="Bilingual descriptive captions" default /></video> : <div className="media-fallback"><h3>Rendered MP4 is not installed yet.</h3><p>The adaptive presentation above contains the complete instruction and works with every visual theme. Run the local media renderer to install MP4 copies.</p><button type="button" onClick={() => setMode("adaptive")}>Use adaptive presentation</button></div>}
    </div>}
    {mode === "transcript" && <article className="transcript"><h3>Descriptive transcript</h3>{section.media.transcript.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>}
  </section>;
}

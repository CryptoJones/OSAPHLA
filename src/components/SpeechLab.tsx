import { useEffect, useRef, useState } from "react";
import { db } from "../lib/db";
import { normalizeAnswer } from "../lib/answers";
import type { Course } from "../types";
import { isMemoryConstrainedIOSBrowser } from "../lib/platform";

async function decodeForWhisper(blob: Blob) {
  const context = new AudioContext({ sampleRate: 16_000 });
  const decoded = await context.decodeAudioData(await blob.arrayBuffer());
  const source = decoded.getChannelData(0);
  if (decoded.sampleRate === 16_000) { await context.close(); return new Float32Array(source); }
  const length = Math.ceil(source.length * 16_000 / decoded.sampleRate);
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) output[index] = source[Math.min(source.length - 1, Math.floor(index * decoded.sampleRate / 16_000))];
  await context.close(); return output;
}

function advisorySimilarity(target: string, transcript: string) {
  const expected = new Set(normalizeAnswer(target, false).replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean));
  const heard = new Set(normalizeAnswer(transcript, false).replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean));
  const matches = [...expected].filter((word) => heard.has(word)).length;
  return expected.size ? Math.round(matches / expected.size * 100) : 0;
}

export function SpeechLab({ course, sectionId, target, meaning }: { course: Course; sectionId: string; target: string; meaning: string }) {
  const spanish = course.instructionLocale === "es-419";
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const worker = useRef<Worker | null>(null);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState(spanish ? "Listo. Tu audio nunca sale de este dispositivo." : "Ready. Your audio never leaves this device.");
  const [transcript, setTranscript] = useState("");
  const [keep, setKeep] = useState(false);

  useEffect(() => {
    if (!blob) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(blob); setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  useEffect(() => () => worker.current?.terminate(), []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream);
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.current.onstop = () => { const next = new Blob(chunks.current, { type: recorder.current?.mimeType || "audio/webm" }); setBlob(next); stream.getTracks().forEach((track) => track.stop()); setStatus(spanish ? "La grabación está lista para reproducirla o analizarla localmente." : "Recording ready for playback or optional local analysis."); };
      recorder.current.start(); setRecording(true); setStatus(spanish ? "Grabando…" : "Recording…");
    } catch { setStatus(spanish ? "Se denegó el permiso del micrófono. Aún puedes repetir el modelo en voz alta sin guardar audio." : "Microphone permission was denied. You can still shadow the model aloud without saving audio."); }
  }
  function stop() { recorder.current?.stop(); setRecording(false); }

  async function analyze() {
    if (!blob) return;
    if (isMemoryConstrainedIOSBrowser()) {
      setStatus(spanish ? "El análisis de voz en el dispositivo no está disponible en este navegador en iPhone -- los navegadores de iOS que no son Safari reciben muy poca memoria del sistema para ejecutar el modelo con seguridad y la aplicación puede fallar. Prueba con Safari o usa esta función en una computadora." : "On-device speech analysis isn't available in this browser on iPhone -- non-Safari iOS browsers get too little memory from the OS to run the model safely and it can crash the app. Try Safari, or use this feature on a computer.");
      return;
    }
    setStatus(spanish ? "Preparando el audio localmente…" : "Preparing audio locally…");
    const audio = await decodeForWhisper(blob);
    worker.current ??= new Worker(new URL("../workers/speech.worker.ts", import.meta.url), { type: "module" });
    const id = crypto.randomUUID();
    worker.current.onmessage = async (event) => {
      if (event.data.id !== id) return;
      if (event.data.status === "complete") {
        const text = event.data.text as string; setTranscript(text);
        setStatus(spanish ? `Coincidencia orientativa de palabras: ${advisorySimilarity(target, text)} %. Esto comprueba la transcripción, no el acento ni el nivel ILR.` : `Advisory word-match: ${advisorySimilarity(target, text)}%. This checks transcription, not accent or ILR proficiency.`);
        if (keep) await db.courseRecordings.add({ courseSlug: course.slug, sectionId, createdAt: new Date().toISOString(), blob, transcript: text });
      } else if (event.data.status === "loading") setStatus(spanish ? "Descargando o cargando desde la caché el modelo de voz en el dispositivo…" : event.data.message);
      else if (event.data.status === "transcribing") setStatus(spanish ? "Transcribiendo localmente…" : event.data.message);
      else setStatus(spanish ? `Falló el análisis de voz: ${event.data.message}` : event.data.message);
    };
    worker.current.postMessage({ id, audio, language: course.slug === "en" ? "english" : "spanish" }, [audio.buffer]);
  }

  return <section className="speech-lab" aria-labelledby="speech-title">
    <header><p className="eyebrow">{spanish ? "Laboratorio privado de micrófono" : "Private microphone lab"}</p><h2 id="speech-title">{spanish ? "Graba, inspecciona y corrige" : "Record, inspect, and repair"}</h2></header>
    <blockquote lang={course.targetLocale.slice(0, 2)}>{target}</blockquote><p className="english-meaning"><strong>{spanish ? "Significado en español:" : "English meaning:"}</strong> {meaning}</p>
    <p>{spanish ? "Escucha la oración modelo en la presentación adaptable y después grábala o produce una respuesta original con la misma estructura." : "Listen to the model sentence in the adaptive presentation, then record it or an original response with the same structure."}</p>
    <p className="speech-disclosure">{spanish ? "El primer análisis puede descargar y guardar en caché un modelo de voz. Tu audio permanece en este dispositivo y nunca se sube. Una vez guardado en caché, el modelo puede usarse sin conexión; antes, el análisis necesita conexión a internet." : "First-time analysis may download and cache a speech model. Your audio stays on this device and is never uploaded. Once cached, the model can be used offline; before then, analysis needs an internet connection."}</p>
    <div className="button-row"><button className={`button ${recording ? "danger" : ""}`} type="button" onClick={recording ? stop : () => void start()}>{recording ? (spanish ? "Detener grabación" : "Stop recording") : (spanish ? "Iniciar grabación" : "Start recording")}</button>{blob && <button className="button" type="button" onClick={() => void analyze()}>{spanish ? "Analizar localmente" : "Analyze locally"}</button>}</div>
    {audioUrl && <audio controls src={audioUrl} />}
    <label className="keep-recording"><input type="checkbox" checked={keep} onChange={(event) => setKeep(event.target.checked)} /> {spanish ? "Conservar esta grabación en el dispositivo después del análisis" : "Keep this recording in on-device IndexedDB after analysis"}</label>
    <p role="status" className="speech-status">{status}</p>
    {transcript && <div className="transcription"><strong>{spanish ? "Modelo escuchado:" : "Model heard:"}</strong> <span lang={course.targetLocale.slice(0, 2)}>{transcript}</span></div>}
  </section>;
}

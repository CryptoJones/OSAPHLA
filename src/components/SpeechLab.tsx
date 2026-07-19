import { useEffect, useRef, useState } from "react";
import { db } from "../lib/db";
import { normalizeAnswer } from "../lib/answers";

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
  const expected = new Set(normalizeAnswer(target, false).replace(/[^a-zñ\s]/g, "").split(/\s+/).filter(Boolean));
  const heard = new Set(normalizeAnswer(transcript, false).replace(/[^a-zñ\s]/g, "").split(/\s+/).filter(Boolean));
  const matches = [...expected].filter((word) => heard.has(word)).length;
  return expected.size ? Math.round(matches / expected.size * 100) : 0;
}

export function SpeechLab({ sectionId, target }: { sectionId: string; target: string }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const worker = useRef<Worker | null>(null);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState("Ready. Your audio never leaves this device.");
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
      recorder.current.onstop = () => { const next = new Blob(chunks.current, { type: recorder.current?.mimeType || "audio/webm" }); setBlob(next); stream.getTracks().forEach((track) => track.stop()); setStatus("Recording ready for playback or optional local analysis."); };
      recorder.current.start(); setRecording(true); setStatus("Recording…");
    } catch { setStatus("Microphone permission was denied. You can still shadow the model aloud without saving audio."); }
  }
  function stop() { recorder.current?.stop(); setRecording(false); }

  async function analyze() {
    if (!blob) return;
    setStatus("Preparing audio locally…");
    const audio = await decodeForWhisper(blob);
    worker.current ??= new Worker(new URL("../workers/speech.worker.ts", import.meta.url), { type: "module" });
    const id = crypto.randomUUID();
    worker.current.onmessage = async (event) => {
      if (event.data.id !== id) return;
      if (event.data.status === "complete") {
        const text = event.data.text as string; setTranscript(text);
        setStatus(`Advisory word-match: ${advisorySimilarity(target, text)}%. This checks transcription, not accent or ILR proficiency.`);
        if (keep) await db.recordings.add({ sectionId, createdAt: new Date().toISOString(), blob, transcript: text });
      } else setStatus(event.data.message);
    };
    worker.current.postMessage({ id, audio }, [audio.buffer]);
  }

  return <section className="speech-lab" aria-labelledby="speech-title">
    <header><p className="eyebrow">Private microphone lab</p><h2 id="speech-title">Record, inspect, and repair</h2></header>
    <blockquote lang="es">{target}</blockquote>
    <p>Listen to the model sentence in the adaptive presentation, then record it or an original response with the same structure.</p>
    <div className="button-row"><button className={`button ${recording ? "danger" : ""}`} type="button" onClick={recording ? stop : () => void start()}>{recording ? "Stop recording" : "Start recording"}</button>{blob && <button className="button" type="button" onClick={() => void analyze()}>Analyze locally</button>}</div>
    {blob && <audio controls src={audioUrl}><track kind="captions" /></audio>}
    <label className="keep-recording"><input type="checkbox" checked={keep} onChange={(event) => setKeep(event.target.checked)} /> Keep this recording in on-device IndexedDB after analysis</label>
    <p role="status" className="speech-status">{status}</p>
    {transcript && <div className="transcription"><strong>Model heard:</strong> <span lang="es">{transcript}</span></div>}
  </section>;
}

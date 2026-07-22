/// <reference lib="webworker" />
import { env, pipeline } from "@huggingface/transformers";

env.allowRemoteModels = true;
env.useBrowserCache = true;
// The pipeline overload union is intentionally hidden behind a worker-local callable.
let transcriber: any = null;

self.onmessage = async (event: MessageEvent<{ id: string; audio: Float32Array; language: "spanish" | "english" }>) => {
  const { id, audio, language } = event.data;
  try {
    self.postMessage({ id, status: "loading", message: "Downloading or loading the cached on-device speech model…" });
    // "gpu" in navigator only means the WebGPU API is exposed, not that it works reliably --
    // ONNX Runtime Web's WebGPU backend crashed the whole tab on real hardware (2026-07-19).
    // WASM is slower but doesn't take the GPU process down with it.
    transcriber ??= await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
      device: "wasm",
      dtype: "q8"
    });
    self.postMessage({ id, status: "transcribing", message: "Transcribing locally…" });
    const result = await transcriber(audio, { language, task: "transcribe" }) as { text?: string };
    self.postMessage({ id, status: "complete", text: result.text?.trim() ?? "" });
  } catch (error) {
    self.postMessage({ id, status: "error", message: error instanceof Error ? error.message : "Speech analysis failed." });
  }
};

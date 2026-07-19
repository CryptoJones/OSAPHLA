/// <reference lib="webworker" />
import { env, pipeline } from "@huggingface/transformers";

env.allowRemoteModels = true;
env.useBrowserCache = true;
// The pipeline overload union is intentionally hidden behind a worker-local callable.
let transcriber: any = null;

self.onmessage = async (event: MessageEvent<{ id: string; audio: Float32Array }>) => {
  const { id, audio } = event.data;
  try {
    self.postMessage({ id, status: "loading", message: "Loading the private on-device speech model…" });
    transcriber ??= await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
      device: "gpu" in navigator ? "webgpu" : "wasm",
      dtype: "q8"
    });
    self.postMessage({ id, status: "transcribing", message: "Transcribing locally…" });
    const result = await transcriber(audio, { language: "spanish", task: "transcribe" }) as { text?: string };
    self.postMessage({ id, status: "complete", text: result.text?.trim() ?? "" });
  } catch (error) {
    self.postMessage({ id, status: "error", message: error instanceof Error ? error.message : "Speech analysis failed." });
  }
};

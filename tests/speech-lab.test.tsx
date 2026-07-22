import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import spanishJson from "../src/data/es/course.json";
import englishJson from "../src/data/en/course.json";
import { SpeechLab } from "../src/components/SpeechLab";
import type { Course } from "../src/types";

describe("speech model disclosure", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("explains the first-use download, local audio handling, and offline behavior in English", () => {
    render(<SpeechLab course={spanishJson as Course} sectionId="w01-briefing" target="Hola" meaning="Hello" />);
    expect(screen.getByText("First-time analysis may download and cache a speech model. Your audio stays on this device and is never uploaded. Once cached, the model can be used offline; before then, analysis needs an internet connection.")).toBeInTheDocument();
  });

  it("provides the equivalent disclosure in Spanish", () => {
    render(<SpeechLab course={englishJson as Course} sectionId="w01-briefing" target="Hello" meaning="Hola" />);
    expect(screen.getByText("El primer análisis puede descargar y guardar en caché un modelo de voz. Tu audio permanece en este dispositivo y nunca se sube. Una vez guardado en caché, el modelo puede usarse sin conexión; antes, el análisis necesita conexión a internet.")).toBeInTheDocument();
  });

  it("renders playable recorded audio without an invalid source-less caption track", async () => {
    class FakeMediaRecorder {
      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {}
      stop() {
        this.ondataavailable?.({ data: new Blob(["recording"], { type: this.mimeType }) });
        this.onstop?.();
      }
    }
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) } });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:recording") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });

    const { container } = render(<SpeechLab course={spanishJson as Course} sectionId="w01-briefing" target="Hola" meaning="Hello" />);
    const component = within(container);
    fireEvent.click(component.getByRole("button", { name: "Start recording" }));
    fireEvent.click(await component.findByRole("button", { name: "Stop recording" }));

    await waitFor(() => expect(container.querySelector("audio")).toHaveAttribute("src", "blob:recording"));
    expect(container.querySelector("audio")).toHaveAttribute("controls");
    expect(container.querySelector("track")).not.toBeInTheDocument();
  });
});

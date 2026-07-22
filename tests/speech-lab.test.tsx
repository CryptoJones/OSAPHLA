import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import spanishJson from "../src/data/es/course.json";
import englishJson from "../src/data/en/course.json";
import { SpeechLab } from "../src/components/SpeechLab";
import type { Course } from "../src/types";

describe("speech model disclosure", () => {
  it("explains the first-use download, local audio handling, and offline behavior in English", () => {
    render(<SpeechLab course={spanishJson as Course} sectionId="w01-briefing" target="Hola" meaning="Hello" />);
    expect(screen.getByText("First-time analysis may download and cache a speech model. Your audio stays on this device and is never uploaded. Once cached, the model can be used offline; before then, analysis needs an internet connection.")).toBeInTheDocument();
  });

  it("provides the equivalent disclosure in Spanish", () => {
    render(<SpeechLab course={englishJson as Course} sectionId="w01-briefing" target="Hello" meaning="Hola" />);
    expect(screen.getByText("El primer análisis puede descargar y guardar en caché un modelo de voz. Tu audio permanece en este dispositivo y nunca se sube. Una vez guardado en caché, el modelo puede usarse sin conexión; antes, el análisis necesita conexión a internet.")).toBeInTheDocument();
  });
});

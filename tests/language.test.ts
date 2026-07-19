import { describe, expect, it } from "vitest";
import { narrationLocale } from "../src/lib/language";

describe("narration locale", () => {
  it("selects Spanish without requiring written accents", () => {
    expect(narrationLocale("Hola, me llamo Alex y vivo en Nebraska.")).toBe("es-US");
  });

  it("selects English for instructional prose containing Spanish terms", () => {
    expect(narrationLocale("Use ser versus estar in this section.")).toBe("en-US");
  });

  it("uses accented Spanish as a strong language signal", () => {
    expect(narrationLocale("¿Dónde están los baños?")).toBe("es-US");
  });
});

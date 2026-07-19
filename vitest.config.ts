import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], css: true, exclude: ["e2e/**", "node_modules/**", "dist/**"] }
});

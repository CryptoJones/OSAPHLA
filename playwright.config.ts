import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4179",
    browserName: "chromium",
    viewport: { width: 1280, height: 900 }
  },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 4179", url: "http://127.0.0.1:4179", reuseExistingServer: true }
});

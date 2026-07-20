import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { ThemeProvider } from "./theme";
import "./styles.css";

registerSW({ immediate: true });
if ("caches" in window) void Promise.all(["espanol-media-v2", "osaphla-media-v3-es", "osaphla-media-v3-en"].map((name) => caches.delete(name)));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider><App /></ThemeProvider>
  </StrictMode>
);

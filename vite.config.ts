import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: '/OSAPHLA/',
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    // Served only via the nginx reverse proxy on 127.0.0.1:4173 (never exposed directly),
    // so the Host header can be whatever the front door forwards (w3b.cryptojones.dev, the
    // LAN hostname, etc.) — disable Vite's DNS-rebinding host allowlist rather than enumerate them.
    allowedHosts: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.svg"],
      manifest: {
        name: "Open Source Accessible Pan-Hispanic Language Academy",
        short_name: "OSAPHLA",
        description: "An open-source, accessible, offline-first academy for learning Spanish or English.",
        theme_color: "#071417",
        background_color: "#071417",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json,vtt}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "audio" || request.destination === "video",
            handler: "NetworkFirst",
            options: { cacheName: "osaphla-media-v3", networkTimeoutSeconds: 2, rangeRequests: true, expiration: { maxEntries: 7000 } }
          }
        ]
      }
    })
  ]
});

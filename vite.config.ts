import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.svg"],
      manifest: {
        name: "Open Source Accessible Pan-Hispanic Language Academy",
        short_name: "OSAPHLA",
        description: "An open-source, accessible, offline-first Pan-Hispanic Spanish language academy.",
        theme_color: "#071417",
        background_color: "#071417",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json,vtt}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "audio" || request.destination === "video",
            handler: "NetworkFirst",
            options: { cacheName: "espanol-media-v2", networkTimeoutSeconds: 2, rangeRequests: true, expiration: { maxEntries: 420 } }
          }
        ]
      }
    })
  ]
});

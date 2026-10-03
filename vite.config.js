import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: { chunkSizeWarningLimit: 800 },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        // Cache Google Fonts so the app keeps its look offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        id: "/",
        name: "Youth Notes",
        short_name: "Youth Notes",
        description: "Sermon notes, groups, and check-ins for our church youth.",
        theme_color: "#F6F6FA",
        background_color: "#F6F6FA",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "192.png", sizes: "192x192", type: "image/png" },
          { src: "512.png", sizes: "512x512", type: "image/png" },
          { src: "512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});

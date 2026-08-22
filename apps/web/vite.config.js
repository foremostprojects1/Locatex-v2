import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The production build is served by the API itself (single deployment), so the app always
 * calls the API on its own origin under /api. In development the proxy below reproduces
 * that: the browser sees one origin, cookies stay first-party, and there is no CORS.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});

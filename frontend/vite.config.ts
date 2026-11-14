/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    // Use jsPDF's browser build (the one the app ships) rather than its Node build.
    alias: { jspdf: "jspdf/dist/jspdf.es.min.js" },
  },
});

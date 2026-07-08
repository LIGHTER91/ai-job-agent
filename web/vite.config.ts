import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/ai-job-agent/",
  build: {
    chunkSizeWarningLimit: 6500,
  },
  worker: {
    format: "es",
  },
});

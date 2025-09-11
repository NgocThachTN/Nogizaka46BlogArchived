import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/gemini": {
        target: "https://generativelanguage.googleapis.com/v1beta",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gemini/, ""),
        secure: false,
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      path: "path-browserify",
    },
  },
  build: {
    // Optimize for Vercel deployment
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Kuroshiro into separate chunk for lazy loading
          'furigana': ['kuroshiro', 'kuroshiro-analyzer-kuromoji'],
        },
      },
    },
  },
  ssr: {
    // Don't try to load these packages on server-side
    noExternal: [],
    external: ['kuroshiro', 'kuroshiro-analyzer-kuromoji'],
  },
  server: {
    proxy: {
      "/gemini": {
        target: "https://generativelanguage.googleapis.com/v1beta",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gemini/, ""),
        secure: false,
      },
      "/api/proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

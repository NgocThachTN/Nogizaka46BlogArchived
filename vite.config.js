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
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks to reduce initial load
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/pro-components', '@ant-design/icons'],
          // Lazy load furigana libraries
          'furigana': ['kuroshiro', 'kuroshiro-analyzer-kuromoji'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
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

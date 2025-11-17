import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';

// Custom plugin to serve kuromoji dictionary files correctly
function kuromojiDictPlugin() {
  return {
    name: 'kuromoji-dict-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Intercept requests to /dict/*.gz files
        if (req.url && req.url.startsWith('/dict/') && req.url.endsWith('.gz')) {
          const fileName = path.basename(req.url);
          const filePath = path.join(process.cwd(), 'public', 'dict', fileName);
          
          if (fs.existsSync(filePath)) {
            // Serve the .gz file as-is, without decompression
            const fileContent = fs.readFileSync(filePath);
            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Encoding', 'identity'); // Don't auto-decompress
            res.setHeader('Content-Length', fileContent.length);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.end(fileContent);
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), kuromojiDictPlugin()],
  resolve: {
    alias: {
      path: "path-browserify",
    },
  },
  // Treat .gz files as static assets (don't transform them)
  assetsInclude: ['**/*.gz', '**/*.dat'],
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
    // Ensure dict files are copied to dist
    copyPublicDir: true,
  },
  publicDir: 'public',
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

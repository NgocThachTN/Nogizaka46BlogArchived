import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';

// Jisho dictionary middleware — chạy trực tiếp trong Vite, không cần local-proxy-server
function jishoDictPlugin() {
  return {
    name: 'jisho-dict-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/jisho')) return next();

        const url = new URL(req.url, 'http://localhost');
        const word = url.searchParams.get('word');
        if (!word) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'word param required' }));
          return;
        }

        try {
          const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word.trim())}`;
          const response = await fetch(jishoUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; NogizakaBlogReader/1.0)',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) throw new Error(`Jisho returned ${response.status}`);
          const data = await response.json();

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = 200;
          res.end(JSON.stringify(data));
        } catch (err) {
          console.error('[jisho middleware] error:', err.message);
          res.statusCode = 502;
          res.end(JSON.stringify({ error: err.message, data: [] }));
        }
      });
    }
  };
}

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
  plugins: [react(), jishoDictPlugin(), kuromojiDictPlugin()],
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
        manualChunks(id) {
          if (id.includes("kuroshiro") || id.includes("kuromoji")) {
            return "furigana";
          }

          if (id.includes("@google/generative-ai")) {
            return "translation-sdk";
          }

          // Let Rollup decide how React/Ant Design vendor modules are grouped.
          // Forcing them into separate manual chunks was creating a circular
          // dependency in the production bundle that breaks on Vercel.

          if (id.includes(`${path.sep}src${path.sep}features${path.sep}blogs${path.sep}services${path.sep}blogService`)) {
            return "blog-service";
          }

          if (id.includes(`${path.sep}src${path.sep}features${path.sep}members${path.sep}data${path.sep}graduatedMembersLoader`)) {
            return "member-data";
          }
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

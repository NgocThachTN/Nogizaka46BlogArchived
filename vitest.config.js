import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/utils/**/*.js", "src/api/**/*.js", "src/services/**/*.js"],
      exclude: ["src/**/index.js"],
    },
  },
});

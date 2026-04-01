import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/api/**/*.ts",
        "src/lib/utils/**/*.ts",
        "src/features/blogs/services/**/*.ts",
      ],
      exclude: ["src/**/index.ts"],
    },
  },
});

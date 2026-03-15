import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    setupFiles: ["./src/__tests__/setup.ts"],
    alias: {
      "@/": path.resolve(__dirname, "apps/web/src/"),
      "@wisestory/testing": path.resolve(__dirname, "packages/testing/src"),
    },
  },
});

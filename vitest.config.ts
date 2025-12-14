import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/test-env.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["**/*.test.js", "**/*.spec.js"],
    coverage: {
      reporter: ["text", "lcov"],
      provider: "v8"
    }
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@config": path.resolve(__dirname, "src/config"),
      "@middleware": path.resolve(__dirname, "src/middleware"),
      "@modules": path.resolve(__dirname, "src/modules"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@utils": path.resolve(__dirname, "src/utils")
    }
  }
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    exclude: ["**/node_modules/**", "**/.stryker-tmp/**"],
    env: {
      JWT_SECRET: "test-secret",
    },
  },
});

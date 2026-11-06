import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    env: {
      JWT_SECRET: "test-secret",
    },
    env: {
      JWT_SECRET: "test-secret",
    },
  },
});

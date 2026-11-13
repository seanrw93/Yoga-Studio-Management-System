import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    exclude: ["**/node_modules/**", "**/.stryker-tmp/**"],
    env: {
      NODE_ENV: "test",
      PORT: "8080",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_SECRET: "a-secure-test-secret-that-is-at-least-32-chars",
      CORS_ORIGIN: "http://localhost:5173",
      ENABLE_ADMIN_SELF_PROMOTION: "false",
    },
  },
});

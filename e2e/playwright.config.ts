import { defineConfig, devices } from "@playwright/test";
import { BACKEND_ENV } from "./env";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // reuseExistingServer is off so a running dev server (dev database) is never used by mistake.
  webServer: [
    {
      command: "npm run build && npm start",
      cwd: "../backend",
      url: "http://localhost:8080/api/health",
      env: BACKEND_ENV,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      cwd: "../frontend",
      url: "http://localhost:3000",
      reuseExistingServer: false,
    },
  ],
});

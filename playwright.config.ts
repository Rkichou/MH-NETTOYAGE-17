import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", timeout: 60000, workers: 1,
  use: { baseURL: process.env.TEST_URL || "http://localhost:3107", browserName: "chromium", channel: "chrome", headless: true, trace: "retain-on-failure" },
  webServer: process.env.TEST_URL ? undefined : {
    command: "node node_modules/next/dist/bin/next start --port 3107",
    url: "http://localhost:3107", reuseExistingServer: false, timeout: 60000,
  },
  reporter: "list",
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/viagens",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
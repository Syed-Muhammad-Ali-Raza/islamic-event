import { defineConfig, devices } from "@playwright/test";
import path from "path";

const REPO_ROOT = __dirname;

// Full-path npm on Windows dodges the rogue Node v26 shadowing bug
// (see AGENTS.md). On other platforms, plain `npm` is fine.
const NPM =
  process.platform === "win32"
    ? '"C:\\Program Files\\nodejs\\npm.cmd"'
    : "npm";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:4000";
const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: path.join(REPO_ROOT, "e2e"),
  outputDir: path.join(REPO_ROOT, "test-results"),
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `${NPM} run dev:api`,
      cwd: REPO_ROOT,
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `${NPM} run dev:web`,
      cwd: REPO_ROOT,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});

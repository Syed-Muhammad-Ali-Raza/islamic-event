import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

const REPO_ROOT = __dirname;

// Load .env for SEED_SUPER_ADMIN_* (read by e2e/fixtures.ts to log in as the
// seeded super admin). apps/api/.env wins over the repo-root .env — the same
// precedence as the seed's findEnvFile() — and dotenv never overwrites
// variables already in process.env (CI sets them at the job level).
dotenv.config({ path: path.join(REPO_ROOT, "apps", "api", ".env") });
dotenv.config({ path: path.join(REPO_ROOT, ".env") });

// The repo-root .env exists for docker-compose and carries `PORT=4000` (the
// host port of the api service). Playwright passes its own environment to the
// webServer children and Next.js reads PORT, so without this the web dev server
// would try to bind 4000 and die with EADDRINUSE next to the API. Both dev
// servers keep their defaults (web 3000, api 4000).
delete process.env.PORT;

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
      use: {
        ...devices["Desktop Chrome"],
        // Local escape hatch: when `npx playwright install` cannot reach the
        // browser CDN (30 s request timeout, endless retry), point the suite at
        // an installed browser instead, e.g. E2E_BROWSER_CHANNEL=chrome (or
        // msedge). CI never sets it, so it keeps using its cached download.
        ...(process.env.E2E_BROWSER_CHANNEL
          ? { channel: process.env.E2E_BROWSER_CHANNEL }
          : {}),
      },
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

import { execSync } from "child_process";
import path from "path";

// Runs once before the whole suite: reset the test database so every run
// starts from a clean schema (no seeds — tests create their own data).
export default function globalSetup(): void {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:12345@localhost:5432/community_events_test";

  const schema = path.resolve(__dirname, "..", "prisma", "schema.prisma");

  execSync(
    `npx prisma db push --force-reset --accept-data-loss --skip-generate --schema="${schema}"`,
    {
      env: { ...process.env, DATABASE_URL: url },
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    }
  );
}

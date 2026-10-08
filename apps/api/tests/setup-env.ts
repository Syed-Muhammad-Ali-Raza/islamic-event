// Runs in every Jest worker BEFORE any application module is imported.
// Overrides DATABASE_URL so tests always hit the isolated test database,
// even though apps/api/.env points at the development one (dotenv never
// overrides variables that are already set).

process.env.NODE_ENV = "test";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:12345@localhost:5432/community_events_test";

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "test-cloud";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "test-key";
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "test-secret";
process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// Runs in every Jest worker BEFORE any application module is imported.
// Overrides DATABASE_URL so tests always hit the isolated test database,
// even though apps/api/.env points at the development one (dotenv never
// overrides variables that are already set).

process.env.NODE_ENV = "test";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:12345@localhost:5432/community_events_test";

// Local Postgres has no pooler, so both Prisma URLs point at the same database.
process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "test-cloud";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "test-key";
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "test-secret";
process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3000";
process.env.CRON_SECRET = process.env.CRON_SECRET ?? "test-cron-secret";

// Tests must never deliver real email or write to a real bucket: apps/api/.env
// may carry production SMTP / object-storage credentials for local smoke tests.
// Suites that exercise a transport set their own fake values explicitly.
delete process.env.BREVO_API_KEY;
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.S3_ENDPOINT_URL = "";
process.env.S3_ACCESS_KEY_ID = "";
process.env.S3_SECRET_ACCESS_KEY = "";
process.env.S3_BUCKET = "";

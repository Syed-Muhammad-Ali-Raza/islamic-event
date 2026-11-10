import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { z } from "zod";

// Load .env by walking up from this file until one is found (works from
// both src/ under tsx and dist/ under node)
function findEnvFile(): string {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return path.resolve(__dirname, "../../../../.env");
}

// Tests supply their own environment (tests/setup-env.ts) and must never
// inherit a developer's .env -- it may hold production SMTP or bucket
// credentials, which would make test runs deliver real email or write to a real
// bucket. Skipping the load also keeps `delete process.env.X` meaningful.
if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: findEnvFile() });
}

const PLACEHOLDER_SECRETS = new Set([
  "your-access-secret-min-32-chars",
  "your-refresh-secret-min-32-chars",
  "ci-access-secret",
  "ci-refresh-secret",
  "test-access-secret",
  "test-refresh-secret",
  "changeme",
  "secret",
]);

function looksLikePlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    PLACEHOLDER_SECRETS.has(v) ||
    v.startsWith("your-") ||
    v.startsWith("changeme") ||
    v === "secret"
  );
}

// First non-empty, trimmed value -- lets the same setting be supplied under a
// project-specific name (S3_*) or the AWS-standard one the SDK reads (AWS_*).
function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

// Startup validation — fails fast with key names only (never values).
const EnvSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    DATABASE_URL: z
      .string({ required_error: "DATABASE_URL is required" })
      .min(1, "DATABASE_URL is required"),
    JWT_ACCESS_SECRET: z
      .string({ required_error: "JWT_ACCESS_SECRET is required" })
      .min(1, "JWT_ACCESS_SECRET is required"),
    JWT_REFRESH_SECRET: z
      .string({ required_error: "JWT_REFRESH_SECRET is required" })
      .min(1, "JWT_REFRESH_SECRET is required"),
    // Optional: the S3-compatible store (Neon Object Storage) is the default
    // image backend. Cloudinary stays supported as a fallback, so neither is
    // required to boot -- uploads return 503 with a clear message when neither
    // has usable credentials.
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
    CLOUDINARY_API_KEY: z.string().optional().default(""),
    CLOUDINARY_API_SECRET: z.string().optional().default(""),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
      const value = env[key];
      if (value.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `must be at least 32 characters in production (got ${value.length}) — generate a random secret, e.g. "openssl rand -hex 32"`,
        });
      } else if (looksLikePlaceholder(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "is a placeholder value in production — generate a random secret",
        });
      }
    }

    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "must differ from JWT_ACCESS_SECRET in production",
      });
    }
  });

function loadEnv(): z.infer<typeof EnvSchema> {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  if (parsed.data.NODE_ENV === "development") {
    if (looksLikePlaceholder(parsed.data.JWT_ACCESS_SECRET) || looksLikePlaceholder(parsed.data.JWT_REFRESH_SECRET)) {
      console.warn(
        "[config] JWT secrets look like placeholders — fine for local dev, rejected when NODE_ENV=production"
      );
    }
  }
  return parsed.data;
}

const env = loadEnv();

export const config = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(process.env.PORT ?? "4000", 10),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",

  database: {
    url: env.DATABASE_URL,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },

  // S3-compatible object storage. Neon Object Storage injects AWS-standard
  // names for the production branch; both spellings work here.
  storage: {
    endpoint: firstNonEmpty(process.env.S3_ENDPOINT_URL, process.env.AWS_ENDPOINT_URL_S3),
    region: firstNonEmpty(process.env.S3_REGION, process.env.AWS_REGION) || "us-east-2",
    bucket: firstNonEmpty(process.env.S3_BUCKET),
    accessKeyId: firstNonEmpty(process.env.S3_ACCESS_KEY_ID, process.env.AWS_ACCESS_KEY_ID),
    secretAccessKey: firstNonEmpty(process.env.S3_SECRET_ACCESS_KEY, process.env.AWS_SECRET_ACCESS_KEY),
    // Anonymous read base for public_read buckets. Defaults to
    // "<endpoint>/<bucket>", which is the Neon storage URL shape.
    publicBaseUrl: firstNonEmpty(process.env.S3_PUBLIC_BASE_URL),
  },

  app: {
    // `||` (not `??`) so an empty env var from a host dashboard still falls
    // back — production links must never become relative/broken.
    url: process.env.APP_URL?.trim() || "http://localhost:3000",
    name: process.env.APP_NAME?.trim() || "Community Events",
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || "support@communityevents.pk",
  },

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    // Same reasoning as `app.url`: an empty EMAIL_FROM from a host dashboard
    // should fall back to SMTP_USER, never produce an empty sender address.
    from:
      process.env.EMAIL_FROM?.trim() ||
      (process.env.SMTP_USER?.trim()
        ? `Community Events <${process.env.SMTP_USER.trim()}>`
        : "Community Events <no-reply@communityevents.pk>"),
  },

  cors: {
    // Comma-separated allow-list (CORS_ORIGINS preferred; CORS_ORIGIN still
    // accepted for backwards compatibility). Never hardcoded — empty in prod
    // config means callers must set the env var.
    origins: (
      process.env.CORS_ORIGINS ??
      process.env.CORS_ORIGIN ??
      "http://localhost:3000"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  },

  upload: {
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  },

  // Brevo transactional API (preferred on serverless: one HTTPS call, no SMTP
  // handshake). Takes priority over SMTP when set.
  brevo: {
    apiKey: process.env.BREVO_API_KEY?.trim() ?? "",
  },

  // Vercel Cron calls GET /internal/reminders with "Authorization: Bearer
  // <CRON_SECRET>" when this env var is set. Empty means the endpoint is
  // disabled (503) — it must never be publicly triggerable.
  cron: {
    secret: process.env.CRON_SECRET?.trim() ?? "",
  },
} as const;

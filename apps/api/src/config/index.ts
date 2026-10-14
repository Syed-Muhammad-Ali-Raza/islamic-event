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

dotenv.config({ path: findEnvFile() });

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
    CLOUDINARY_CLOUD_NAME: z
      .string({ required_error: "CLOUDINARY_CLOUD_NAME is required" })
      .min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z
      .string({ required_error: "CLOUDINARY_API_KEY is required" })
      .min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z
      .string({ required_error: "CLOUDINARY_API_SECRET is required" })
      .min(1, "CLOUDINARY_API_SECRET is required"),
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

  app: {
    url: process.env.APP_URL ?? "http://localhost:3000",
    name: process.env.APP_NAME ?? "Community Events",
    supportEmail: process.env.SUPPORT_EMAIL ?? "support@communityevents.pk",
  },

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "Community Events <no-reply@communityevents.pk>",
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  },

  upload: {
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
} as const;

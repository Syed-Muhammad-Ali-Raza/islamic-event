import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",

  database: {
    url: requireEnv("DATABASE_URL"),
  },

  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },

  cloudinary: {
    cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
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

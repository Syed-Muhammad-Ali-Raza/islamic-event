import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";

// Cloudinary is the optional fallback image backend. Treat the placeholder
// trio from .env.example as "not configured" so a demo deployment reports the
// real state instead of failing every upload with a 401 from Cloudinary.
export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return false;
  if (/^(your-|placeholder)/i.test(cloudName)) return false;
  return true;
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export { cloudinary };

import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { config } from "../../config";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";
import { Errors } from "../../utils/AppError";

// ─── Image storage ───────────────────────────────────────────────────────────
// Primary backend: S3-compatible object storage (Neon Object Storage in the
// production deployment -- same project as Postgres, branching with the DB).
// Fallback: Cloudinary, if real credentials are supplied. With neither, uploads
// fail with a 503 that names the missing configuration instead of a mystery 500.

export type ImageProvider = "s3" | "cloudinary" | "none";

export interface UploadedImage {
  url: string;
  /** Object key (S3) or Cloudinary public id -- the handle used for deletes. */
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  provider: Exclude<ImageProvider, "none">;
}

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export function isStorageConfigured(): boolean {
  const { endpoint, bucket, accessKeyId, secretAccessKey } = config.storage;
  return Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
}

export function imageProvider(): ImageProvider {
  if (isStorageConfigured()) return "s3";
  if (isCloudinaryConfigured()) return "cloudinary";
  return "none";
}

if (imageProvider() === "none") {
  console.warn(
    "[storage] No image storage configured -- poster uploads are disabled (503). " +
      "Set S3_ENDPOINT_URL / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY " +
      "(Neon Object Storage) or all three CLOUDINARY_* variables."
  );
}

// Lazy singleton: the SDK is only constructed when an upload actually happens,
// so a deployment without storage still boots cleanly.
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: config.storage.endpoint,
      region: config.storage.region,
      credentials: {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey,
      },
      // Neon Object Storage (and most S3-compatible stores) require path-style
      // addressing: <endpoint>/<bucket>/<key>.
      forcePathStyle: true,
    });
  }
  return s3Client;
}

interface OptimisedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

function sniffFormat(buffer: Buffer): string {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF") return "webp";
  return "bin";
}

function contentTypeFor(format: string): string {
  if (format === "jpg") return "image/jpeg";
  return `image/${format}`;
}

// Best effort: a 6 MB phone photo becomes ~150-250 KB at 1600 px, which keeps
// the free storage tier viable for thousands of posters. If sharp cannot decode
// the file we store the original bytes rather than failing the upload.
async function optimise(buffer: Buffer): Promise<OptimisedImage> {
  try {
    const { data, info } = await sharp(buffer, { failOn: "none" })
      .rotate() // honour EXIF orientation
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      format: "webp",
      bytes: data.length,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[storage] image optimisation skipped (${reason}); storing original bytes`);
    return {
      buffer,
      width: 0,
      height: 0,
      format: sniffFormat(buffer),
      bytes: buffer.length,
    };
  }
}

function publicUrl(key: string): string {
  const base =
    config.storage.publicBaseUrl ||
    `${config.storage.endpoint.replace(/\/+$/, "")}/${config.storage.bucket}`;
  return `${base.replace(/\/+$/, "")}/${key}`;
}

async function uploadToS3(buffer: Buffer, folder: string): Promise<UploadedImage> {
  const image = await optimise(buffer);
  // Month prefix keeps listings sane; the key itself is immutable and unique so
  // a CDN/browser can cache it forever.
  const month = new Date().toISOString().slice(0, 7);
  const key = `${folder}/${month}/${randomUUID()}.${image.format}`;

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: config.storage.bucket,
        Key: key,
        Body: image.buffer,
        ContentType: contentTypeFor(image.format),
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[storage] S3 upload failed: ${reason}`);
    throw Errors.internal("Image upload failed. Please try again.");
  }

  return {
    url: publicUrl(key),
    publicId: key,
    width: image.width,
    height: image.height,
    format: image.format,
    bytes: image.bytes,
    provider: "s3",
  };
}

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: MAX_DIMENSION, height: MAX_DIMENSION, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          console.error(`[storage] Cloudinary upload failed: ${error?.message ?? "no result"}`);
          reject(Errors.internal("Image upload failed. Please try again."));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            provider: "cloudinary",
          });
        }
      }
    );

    stream.end(buffer);
  });
}

export async function uploadImage(buffer: Buffer, folder = "events"): Promise<UploadedImage> {
  switch (imageProvider()) {
    case "s3":
      return uploadToS3(buffer, folder);
    case "cloudinary":
      return uploadToCloudinary(buffer, folder);
    default:
      throw Errors.serviceUnavailable(
        "Image uploads are not configured on this deployment.",
        "IMAGE_STORAGE_UNAVAILABLE"
      );
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (imageProvider() === "cloudinary") {
    await cloudinary.uploader.destroy(publicId);
    return;
  }

  if (!isStorageConfigured()) return;

  try {
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: config.storage.bucket, Key: publicId })
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[storage] S3 delete failed for ${publicId}: ${reason}`);
  }
}

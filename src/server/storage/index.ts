import { randomBytes } from "node:crypto";
import { LocalDevStorage } from "@/server/storage/local";
import { S3Storage } from "@/server/storage/s3";
import { isProduction } from "@/server/env";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type ObjectStoragePort,
} from "@/server/storage/port";

export function getStorage(): ObjectStoragePort {
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) {
    return new S3Storage();
  }
  if (isProduction()) {
    throw new Error("S3_BUCKET and S3_ACCESS_KEY_ID are required in production");
  }
  return new LocalDevStorage();
}

export function assertImageUpload(file: { type: string; size: number }): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 6 MB or smaller");
  }
}

export function randomObjectKey(extension: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `products/${day}/${randomBytes(16).toString("hex")}.${extension}`;
}

export function extensionForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

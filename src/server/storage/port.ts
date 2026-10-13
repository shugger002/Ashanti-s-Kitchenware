export type StoredObject = {
  key: string;
  url: string;
};

export interface ObjectStoragePort {
  put(input: { bytes: Buffer; contentType: string; key: string }): Promise<StoredObject>;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

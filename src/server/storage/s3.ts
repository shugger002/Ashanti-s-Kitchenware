import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ObjectStoragePort, StoredObject } from "@/server/storage/port";

export class S3Storage implements ObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT?.trim();
    this.bucket = (process.env.S3_BUCKET ?? "").trim();
    this.publicBase = (process.env.S3_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "");
    this.client = new S3Client({
      region: (process.env.S3_REGION ?? "auto").trim() || "auto",
      endpoint: endpoint || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE?.trim() !== "false",
      credentials: {
        accessKeyId: (process.env.S3_ACCESS_KEY_ID ?? "").trim(),
        secretAccessKey: (process.env.S3_SECRET_ACCESS_KEY ?? "").trim(),
      },
      // Supabase Storage rejects the default CRC32 checksum and reports a bad signature.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  async put(input: { bytes: Buffer; contentType: string; key: string }): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.bytes,
        ContentType: input.contentType,
      }),
    );
    return {
      key: input.key,
      url: `${this.publicBase}/${input.key}`,
    };
  }
}

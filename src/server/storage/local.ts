import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectStoragePort, StoredObject } from "@/server/storage/port";
import { getAppUrl } from "@/server/env";

export class LocalDevStorage implements ObjectStoragePort {
  async put(input: { bytes: Buffer; contentType: string; key: string }): Promise<StoredObject> {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = input.key.replaceAll("/", "-");
    await writeFile(path.join(dir, filename), input.bytes);
    return {
      key: `uploads/${filename}`,
      url: `${getAppUrl()}/uploads/${filename}`,
    };
  }
}

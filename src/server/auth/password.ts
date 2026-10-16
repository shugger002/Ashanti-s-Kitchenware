import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

const scrypt = promisify(scryptCb);

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(plain, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    if (hash.startsWith("scrypt:")) {
      const [, saltPart, keyPart] = hash.split(":");
      if (!saltPart || !keyPart) return false;
      const salt = Buffer.from(saltPart, "base64url");
      const expected = Buffer.from(keyPart, "base64url");
      const actual = (await scrypt(plain, salt, expected.length)) as Buffer;
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    }
    const argon2 = (await import("argon2")).default;
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

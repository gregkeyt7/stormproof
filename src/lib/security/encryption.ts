import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function resolveEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 16) {
    throw new Error("ENCRYPTION_KEY is missing or too short.");
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string): string {
  if (!value) {
    throw new Error("Cannot encrypt an empty secret.");
  }
  const key = resolveEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, bodyHex] = payload.split(":");
  if (!ivHex || !tagHex || !bodyHex) {
    throw new Error("Encrypted payload format is invalid.");
  }

  const key = resolveEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bodyHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

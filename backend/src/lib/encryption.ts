import crypto from "node:crypto";
import fs from "node:fs/promises";

import { config } from "../config";

const ENC_ALGO = "aes-256-gcm";
const KEY = crypto
  .createHash("sha256")
  .update(config.storageEncryptionKey, "utf8")
  .digest();

export type EncryptionMetadata = {
  iv: string;
  authTag: string;
};

export function encryptBuffer(buffer: Buffer): {
  encrypted: Buffer;
  metadata: EncryptionMetadata;
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    metadata: {
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    },
  };
}

export function decryptBuffer(buffer: Buffer, metadata: EncryptionMetadata): Buffer {
  const decipher = crypto.createDecipheriv(
    ENC_ALGO,
    KEY,
    Buffer.from(metadata.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(metadata.authTag, "hex"));
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

export function encryptData(buffer: Buffer): { data: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, KEY, iv);
  const data = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { data, iv, authTag };
}

export async function encryptFileInPlace(path: string): Promise<EncryptionMetadata> {
  const raw = await fs.readFile(path);
  const { encrypted, metadata } = encryptBuffer(raw);
  await fs.writeFile(path, encrypted);
  return metadata;
}

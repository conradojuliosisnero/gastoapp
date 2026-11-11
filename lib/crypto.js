import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Format: v1.<iv>.<authTag>.<ciphertext>, all base64. The version prefix allows key rotation later.
const VERSION = "v1";

function getKey() {
  const key = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY debe ser de 32 bytes en base64.");
  return key;
}

export function encrypt(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decrypt(payload) {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== VERSION) throw new Error("Formato cifrado desconocido.");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

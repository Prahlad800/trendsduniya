import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import env from "../config/env.js";
import { AppError } from "./apiResponse.js";
function key() {
  if (!/^[a-f\d]{64}$/i.test(env.aiEncryptionKey || "")) throw new AppError("Configure AI_ENCRYPTION_KEY with 32 random bytes encoded as hex", 503);
  return Buffer.from(env.aiEncryptionKey, "hex");
}
export function encryptSecret(value) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("hex"), cipher.getAuthTag().toString("hex"), data.toString("hex")].join(":");
}
export function decryptSecret(value) {
  const secret = key();
  try {
    const [version, iv, tag, data] = value.split(":");
    if (version !== "v1") throw new Error();
    const cipher = createDecipheriv("aes-256-gcm", secret, Buffer.from(iv, "hex"));
    cipher.setAuthTag(Buffer.from(tag, "hex"));
    return Buffer.concat([cipher.update(Buffer.from(data, "hex")), cipher.final()]).toString("utf8");
  } catch { throw new AppError("AI credentials could not be decrypted. Re-enter the API key.", 503); }
}

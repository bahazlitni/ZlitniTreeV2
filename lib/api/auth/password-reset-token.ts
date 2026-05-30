import crypto from "crypto";
import { sha256 } from "@/lib/api/auth/token";

const TOKEN_BYTES = 32;

export function generatePasswordResetToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return sha256(token);
}
import crypto from "crypto";

export function generateOtpCode(length: number) {
  const max = 10 ** length;
  return crypto.randomInt(0, max).toString().padStart(length, "0");
}
// src/lib/api/otp/hash.ts

import { sha256 } from "@/lib/api/auth/token";

const OTP_PEPPER = process.env.OTP_PEPPER;

export function hashOtpCode(code: string) {
  if (!OTP_PEPPER) {
    throw new Error("Missing OTP_PEPPER env variable");
  }

  return sha256(`${code}:${OTP_PEPPER}`);
}
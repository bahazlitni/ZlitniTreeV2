import type { OTPType } from "@/lib/generated/prisma/enums";

export const OTP_CODE_LENGTH = 6;
export const LOGIN_OTP_CHALLENGE_COOKIE = "login_otp_challenge";
export const PASSWORD_OTP_CHALLENGE_COOKIE = "password_otp_challenge";
export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export const OTP_RULES = {
  LOGIN: {
    ttlMs: 300_000,
    maxAttempts: 3,
    resendCooldownMs: 30_000,
  },
  RESET_PASSWORD: {
    ttlMs: 600_000,
    maxAttempts: 3,
    resendCooldownMs: 30_000,
  },
} satisfies Record<
  OTPType,
  {
    ttlMs: number;
    maxAttempts: number;
    resendCooldownMs: number;
  }
>;

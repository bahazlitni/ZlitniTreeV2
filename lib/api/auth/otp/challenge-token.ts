import crypto from "crypto";
import { sha256 } from "@/lib/api/auth/token";

const TOKEN_BYTES = 32;

export function generateOtpChallengeSecret() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashOtpChallengeSecret(secret: string) {
  return sha256(secret);
}

export function encodeOtpChallengeCookie(challengeId: string, secret: string) {
  return `${challengeId}.${secret}`;
}

export function parseOtpChallengeCookie(value: string | undefined) {
  if (!value) {
    return null;
  }

  const separatorIndex = value.indexOf(".");

  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null;
  }

  return {
    challengeId: value.slice(0, separatorIndex),
    secret: value.slice(separatorIndex + 1),
  };
}

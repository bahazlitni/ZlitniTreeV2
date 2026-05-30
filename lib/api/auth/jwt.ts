import { PowerType } from "@/lib/generated/prisma/enums";
import { requiredEnv } from "@/lib/utils";
import { SignJWT, jwtVerify } from "jose";

export type AccessTokenPayload = {
  userId: string;
  email: string;
  powerType: PowerType;
};

export type RefreshTokenPayload = {
  userId: string;
  tokenId: string;
};

function encodeSecret(name: string) {
  return new TextEncoder().encode(requiredEnv(name));
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(requiredEnv("JWT_ACCESS_EXPIRES_IN"))
    .sign(encodeSecret("JWT_ACCESS_SECRET"));
}

export async function signRefreshToken(payload: RefreshTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(requiredEnv("JWT_REFRESH_EXPIRES_IN"))
    .sign(encodeSecret("JWT_REFRESH_SECRET"));
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, encodeSecret("JWT_ACCESS_SECRET"));
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, encodeSecret("JWT_REFRESH_SECRET"));
  return payload as RefreshTokenPayload;
}

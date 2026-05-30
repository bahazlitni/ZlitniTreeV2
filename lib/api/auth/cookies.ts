import type { NextRequest, NextResponse } from "next/server";

const REFRESH_TOKEN_COOKIE = "refresh_token";

function readBooleanEnv(value: string | undefined) {
  if (value === undefined) return null;

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return null;
}

export function shouldUseSecureAuthCookies(req?: NextRequest) {
  const forcedValue = readBooleanEnv(process.env.AUTH_COOKIE_SECURE);

  if (forcedValue !== null) return forcedValue;
  if (!req) return process.env.NODE_ENV === "production";

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto?.split(",")[0]?.trim() || req.nextUrl.protocol;

  return protocol === "https" || protocol === "https:";
}

export function setRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string,
  req?: NextRequest,
) {
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: shouldUseSecureAuthCookies(req),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearRefreshTokenCookie(
  response: NextResponse,
  req?: NextRequest,
) {
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: shouldUseSecureAuthCookies(req),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

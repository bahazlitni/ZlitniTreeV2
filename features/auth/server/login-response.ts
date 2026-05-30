import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { signAccessToken, signRefreshToken } from "@/lib/api/auth/jwt";
import { sha256 } from "@/lib/api/auth/token";
import { prisma } from "@/lib/prisma";
import { getSessionByUserId } from "@/features/auth/server/session";
import { PowerType } from "@/lib/generated/prisma/enums";

type LoginUser = {
  id: string;
  email: string;
  powerType: PowerType;
};

export async function createLoginResponse(
  user: LoginUser,
  options: {
    body?: Record<string, unknown>;
    clearLoginOtpChallenge?: boolean;
  } = {},
) {
  const tokenId = uuidv4();
  const accessToken = await signAccessToken({
    userId: user.id,
    email: user.email,
    powerType: user.powerType,
  });
  const refreshToken = await signRefreshToken({
    userId: user.id,
    tokenId,
  });
  const refreshTokenHash = sha256(refreshToken);

  await prisma.$transaction([
    ...(options.clearLoginOtpChallenge
      ? [
          prisma.oTPChallenge.deleteMany({
            where: {
              userId: user.id,
              type: "LOGIN",
            },
          }),
        ]
      : []),
    prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    }),
  ]);

  const session = await getSessionByUserId(user.id);

  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Impossible de charger la session staff." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    ...options.body,
    accessToken,
    user: session,
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

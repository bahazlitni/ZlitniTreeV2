// /api/auth/staff/login/refresh.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/api/auth/jwt";
import { sha256 } from "@/lib/api/auth/token";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {

    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { ok: false, message: "Missing refresh token" },
        { status: 401 },
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    const refreshTokenHash = sha256(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (!storedToken) {
      return NextResponse.json(
        { ok: false, message: "Invalid refresh token" },
        { status: 401 },
      );
    }


    if (storedToken.tokenHash !== refreshTokenHash) {
      return NextResponse.json(
        { ok: false, message: "Invalid refresh token" },
        { status: 401 },
      );
    }

    if (storedToken.revokedAt) {
      return NextResponse.json(
        { ok: false, message: "Refresh token revoked" },
        { status: 401 },
      );
    }

    if (storedToken.expiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: "Refresh token expired" },
        { status: 401 },
      );
    }

    const newTokenId = uuidv4();

    const newAccessToken = await signAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      powerType: storedToken.user.powerType,
    });

    const newRefreshToken = await signRefreshToken({
      userId: storedToken.user.id,
      tokenId: newTokenId,
    });

    const newRefreshTokenHash = sha256(newRefreshToken);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
        },
      }),
      prisma.refreshToken.create({
        data: {
          id: newTokenId,
          userId: storedToken.user.id,
          tokenHash: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const response = NextResponse.json({
      ok: true,
      accessToken: newAccessToken,
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("REFRESH_ERROR:", error);

    return NextResponse.json(
      { ok: false, message: "Invalid or expired refresh token" },
      { status: 401 },
    );
  }
}

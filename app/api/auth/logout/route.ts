// /app/api/auth/staff/logout/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearRefreshTokenCookie } from "@/lib/api/auth/cookies";
import { sha256 } from "@/lib/api/auth/token";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value;

    const response = NextResponse.json({
      ok: true,
      message: "Logged out successfully",
    });

    clearRefreshTokenCookie(response, req);

    if (!refreshToken) {
      return response;
    }

    const refreshTokenHash = sha256(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return response;
  } catch (error) {
    console.error("LOGOUT_ERROR:", error);

    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

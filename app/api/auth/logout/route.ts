// /app/api/auth/staff/logout/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/api/auth/token";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value;

    const response = NextResponse.json({
      ok: true,
      message: "Logged out successfully",
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

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
      { status: 500 }
    );
  }
}

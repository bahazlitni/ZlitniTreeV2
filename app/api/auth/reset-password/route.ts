import { NextRequest, NextResponse } from "next/server";

import { clearRefreshTokenCookie } from "@/lib/api/auth/cookies";
import { hashPassword } from "@/lib/api/auth/password";
import { hashPasswordResetToken } from "@/lib/api/auth/password-reset-token";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!token || !password) {
      return NextResponse.json(
        { ok: false, message: "Reset token and password are required." },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, message: "Password must contain at least 8 characters." },
        { status: 400 },
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashPasswordResetToken(token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        consumedAt: true,
      },
    });

    if (
      !resetToken ||
      resetToken.consumedAt ||
      resetToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { ok: false, message: "Invalid or expired reset token." },
        { status: 401 },
      );
    }

    const now = new Date();
    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { consumedAt: now },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
    ]);

    const response = NextResponse.json({
      ok: true,
      message: "Password has been reset.",
    });

    clearRefreshTokenCookie(response, req);

    return response;
  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

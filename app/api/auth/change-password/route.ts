import { NextRequest, NextResponse } from "next/server";

import { AuthError, requireSession } from "@/features/auth/server/session";
import { clearRefreshTokenCookie } from "@/lib/api/auth/cookies";
import { hashPassword, verifyPassword } from "@/lib/api/auth/password";
import { LoginMode } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const body = await req.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          ok: false,
          message: "Current password and new password are required.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, message: "Password must contain at least 8 characters." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { loginMode: true, passwordHash: true },
    });

    if (!user) {
      throw new AuthError("Forbidden", 403);
    }

    if (user.loginMode === LoginMode.PASSWORDLESS) {
      return NextResponse.json(
        { ok: false, message: "Passwordless accounts do not use passwords." },
        { status: 400 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          ok: false,
          message: "This account does not have a current password.",
        },
        { status: 400 },
      );
    }

    const validPassword = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );

    if (!validPassword) {
      return NextResponse.json(
        { ok: false, message: "Current password is incorrect." },
        { status: 401 },
      );
    }

    const now = new Date();
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: session.id,
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
    ]);

    const response = NextResponse.json({
      ok: true,
      message: "Password updated. Please sign in again.",
    });

    clearRefreshTokenCookie(response, req);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status },
      );
    }

    console.error("CHANGE_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

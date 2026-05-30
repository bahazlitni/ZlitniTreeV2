import { NextRequest, NextResponse } from "next/server";

import {
  MIN_ADMIN_PASSWORD_LENGTH,
  assertRootAccountInvariant,
  isPasswordRequiredMode,
  isRoot,
  parseLoginMode,
  parsePowerType,
  requireUserManager,
  serializeAdminUser,
} from "@/features/admin/server/users";
import { AuthError } from "@/features/auth/server/session";
import { hashPassword } from "@/lib/api/auth/password";
import { LoginMode, PowerType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  try {
    const manager = await requireUserManager(req);

    const users = await prisma.user.findMany({
      where: isRoot(manager) ? undefined : { powerType: PowerType.MEMBER },
      orderBy: [{ powerType: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        passwordHash: true,
        powerType: true,
        loginMode: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      users: users.map(serializeAdminUser),
      managerPowerType: manager.powerType,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    console.error("ADMIN_USERS_GET_ERROR:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const manager = await requireUserManager(req);
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const requestedPowerType = parsePowerType(body.powerType) ?? PowerType.MEMBER;
    const powerType = isRoot(manager) ? requestedPowerType : PowerType.MEMBER;
    const loginMode = parseLoginMode(body.loginMode) ?? LoginMode.PASSWORDLESS;
    const password = String(body.password ?? "");

    if (!email) {
      return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });
    }

    assertRootAccountInvariant({ email, powerType });

    if (!isRoot(manager) && requestedPowerType !== PowerType.MEMBER) {
      throw new AuthError("Admins can only create member accounts.", 403);
    }

    if (isPasswordRequiredMode(loginMode) && password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          message: "A password with at least 8 characters is required for this login mode.",
        },
        { status: 400 },
      );
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        powerType,
        loginMode,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        powerType: true,
        loginMode: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: serializeAdminUser(user),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    console.error("ADMIN_USERS_POST_ERROR:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}

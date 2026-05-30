import { NextRequest, NextResponse } from "next/server";

import {
  MIN_ADMIN_PASSWORD_LENGTH,
  ROOT_EMAIL,
  assertCanManageTarget,
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
import { PowerType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const manager = await requireUserManager(req);
    const { id } = await params;
    const body = await req.json();

    const current = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        powerType: true,
        loginMode: true,
      },
    });

    if (!current) {
      return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
    }

    assertCanManageTarget(manager, current);

    const email = body.email === undefined ? current.email : normalizeEmail(body.email);
    const powerType = body.powerType === undefined
      ? current.powerType
      : parsePowerType(body.powerType);
    const loginMode = body.loginMode === undefined
      ? current.loginMode
      : parseLoginMode(body.loginMode);
    const keepExistingPassword = body.keepExistingPassword === true;
    const password = String(body.password ?? "");

    if (!email) {
      return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });
    }

    if (!powerType) {
      return NextResponse.json({ ok: false, message: "Invalid power type." }, { status: 400 });
    }

    if (!loginMode) {
      return NextResponse.json({ ok: false, message: "Invalid login mode." }, { status: 400 });
    }

    if (!isRoot(manager) && powerType !== PowerType.MEMBER) {
      throw new AuthError("Admins can only keep accounts as members.", 403);
    }

    if (current.email === ROOT_EMAIL && (email !== ROOT_EMAIL || powerType !== PowerType.ROOT)) {
      throw new AuthError("The configured root account cannot be reassigned.", 400);
    }

    assertRootAccountInvariant({ email, powerType });

    const requiresPassword = isPasswordRequiredMode(loginMode);
    const hasUsableExistingPassword = Boolean(current.passwordHash) && keepExistingPassword;

    if (requiresPassword && !hasUsableExistingPassword && password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          message: "A password with at least 8 characters is required for this login mode.",
        },
        { status: 400 },
      );
    }

    const data: {
      email: string;
      powerType: PowerType;
      loginMode: NonNullable<typeof loginMode>;
      passwordHash?: string;
    } = {
      email,
      powerType,
      loginMode,
    };

    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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

    console.error("ADMIN_USERS_PATCH_ERROR:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const manager = await requireUserManager(req);
    const { id } = await params;

    if (id === manager.id) {
      throw new AuthError("You cannot remove your own account.", 400);
    }

    const current = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        powerType: true,
      },
    });

    if (!current) {
      return NextResponse.json({ ok: true });
    }

    assertCanManageTarget(manager, current);

    if (current.email === ROOT_EMAIL || current.powerType === PowerType.ROOT) {
      throw new AuthError("The root account cannot be removed.", 400);
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }

    console.error("ADMIN_USERS_DELETE_ERROR:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}

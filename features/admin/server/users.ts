import { AuthError, requireSession } from "@/features/auth/server/session";
import type { Session } from "@/features/auth/types";
import { LoginMode, PowerType } from "@/lib/generated/prisma/enums";

export const ROOT_EMAIL = "baha.zlitni989@gmail.com";
export const MIN_ADMIN_PASSWORD_LENGTH = 8;

export type AdminUserRow = {
  id: string;
  email: string;
  powerType: PowerType;
  loginMode: LoginMode;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function requireUserManager(req: Request): Promise<Session> {
  const session = await requireSession(req);

  if (session.powerType !== PowerType.ROOT && session.powerType !== PowerType.ADMIN) {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

export function isRoot(session: Pick<Session, "powerType">) {
  return session.powerType === PowerType.ROOT;
}

export function isPasswordRequiredMode(loginMode: LoginMode) {
  return (
    loginMode === LoginMode.PASSWORD_ONLY ||
    loginMode === LoginMode.PASSWORD_AND_OTP
  );
}

export function parsePowerType(value: unknown): PowerType | null {
  if (
    value === PowerType.ROOT ||
    value === PowerType.ADMIN ||
    value === PowerType.MEMBER ||
    value === PowerType.ANON
  ) {
    return value;
  }

  return null;
}

export function parseLoginMode(value: unknown): LoginMode | null {
  if (
    value === LoginMode.PASSWORDLESS ||
    value === LoginMode.PASSWORD_ONLY ||
    value === LoginMode.PASSWORD_AND_OTP
  ) {
    return value;
  }

  return null;
}

export function canManageTarget(
  manager: Session,
  target: { powerType: PowerType; email: string; id?: string },
) {
  if (isRoot(manager)) {
    return true;
  }

  return target.powerType === PowerType.MEMBER;
}

export function assertCanManageTarget(
  manager: Session,
  target: { powerType: PowerType; email: string; id?: string },
) {
  if (!canManageTarget(manager, target)) {
    throw new AuthError("Admins can only manage member accounts.", 403);
  }
}

export function assertRootAccountInvariant(target: {
  email: string;
  powerType: PowerType;
}) {
  if (target.powerType === PowerType.ROOT && target.email !== ROOT_EMAIL) {
    throw new AuthError("The root role is reserved for the configured root account.", 400);
  }
}

export function serializeAdminUser(user: {
  id: string;
  email: string;
  passwordHash: string | null;
  powerType: PowerType;
  loginMode: LoginMode;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserRow {
  return {
    id: user.id,
    email: user.email,
    powerType: user.powerType,
    loginMode: user.loginMode,
    hasPassword: Boolean(user.passwordHash),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

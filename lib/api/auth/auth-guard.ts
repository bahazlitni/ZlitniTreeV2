import type { PowerType } from "@/lib/generated/prisma/enums";
import {
  AuthError,
  requireSession,
} from "@/features/auth/server/session";
import {
  requireAdminSession,
  requireMemberSession,
  requireRootSession,
} from "@/features/auth/server/guards";

import { Session } from "@/features/auth/types";


export type AuthenticatedUser = {
  userId: string;
  email: string;
  powerType: PowerType;
};

function toAuthenticatedUser(session: Session): AuthenticatedUser {
  return {
    userId: session.id,
    email: session.email,
    powerType: session.powerType,
  };
}

export { AuthError };

export async function requireAuth(req: Request): Promise<AuthenticatedUser> {
  const session = await requireSession(req);
  return toAuthenticatedUser(session);
}

export async function requireRoot(req: Request): Promise<AuthenticatedUser> {
  const session = await requireRootSession(req);
  return toAuthenticatedUser(session);
}

export async function requireAdmin(req: Request): Promise<AuthenticatedUser> {
  const session = await requireAdminSession(req);
  return toAuthenticatedUser(session);
}

export async function requireMember(req: Request): Promise<AuthenticatedUser> {
  const session = await requireMemberSession(req);
  return toAuthenticatedUser(session);
}
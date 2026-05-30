import type { Session } from "@/features/auth/types";
import { AuthError, requireSession } from "./session";



export async function requireRootSession(req: Request) {
  const session = await requireSession(req);

  if (session.powerType !== "ROOT") {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

export async function requireAdminSession(req: Request) {
  const session = await requireSession(req);

  if (!hasAdminPower(session) ) {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

export async function requireMemberSession(req: Request) {
  const session = await requireSession(req);

  if (!hasAdminPower(session) && session.powerType !== "MEMBER") {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

export function hasAdminPower(session: Session): boolean {
  return (session.powerType === "ROOT" || session.powerType === "ADMIN");
}

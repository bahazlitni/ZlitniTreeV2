import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionByRefreshToken } from "@/features/auth/server/session";
import { PowerType } from "@/lib/generated/prisma/enums";

export async function requireAdminPageSession() {
  const cookieStore = await cookies();
  const session = await getSessionByRefreshToken(
    cookieStore.get("refresh_token")?.value,
  );

  if (!session) {
    redirect("/en/login");
  }

  if (session.powerType !== PowerType.ROOT && session.powerType !== PowerType.ADMIN) {
    redirect("/en");
  }

  return session;
}

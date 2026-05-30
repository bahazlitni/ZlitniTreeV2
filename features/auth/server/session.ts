import { prisma } from "@/lib/prisma";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/api/auth/jwt";
import { sha256 } from "@/lib/api/auth/token";
import { Session } from "@/features/auth/types";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing access token", 401);
  }

  return authHeader.slice("Bearer ".length).trim();
}
export async function getSessionByUserId(
  userId: string,
): Promise<Session | null> {
  const session = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      powerType: true,
      loginMode: true,
    },
  });

  return session;
}

export async function getOptionalSession(
  req: Request,
): Promise<Session | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = await verifyAccessToken(token);
    return await getSessionByUserId(payload.userId);
  } catch {
    return null;
  }
}

export async function requireSession(
  req: Request,
): Promise<Session> {
  const token = extractBearerToken(req);

  let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    throw new AuthError("Invalid or expired access token", 401);
  }

  const session = await getSessionByUserId(payload.userId);

  if (!session) {
    throw new AuthError("Forbidden", 403);
  }

  return session;
}

export async function getSessionByRefreshToken(
  refreshToken: string | null | undefined,
): Promise<Session | null> {
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const refreshTokenHash = sha256(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      select: {
        tokenHash: true,
        revokedAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            powerType: true,
            loginMode: true,
          },
        },
      },
    });

    if (!storedToken) {
      return null;
    }

    if (storedToken.tokenHash !== refreshTokenHash) {
      return null;
    }

    if (storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return null;
    }

    return getSessionByUserId(storedToken.user.id);
  } catch {
    return null;
  }
}

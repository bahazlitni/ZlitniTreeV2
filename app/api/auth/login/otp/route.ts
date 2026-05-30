import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOtpCode } from "@/lib/api/auth/otp/hash";
import { OTP_RULES, LOGIN_OTP_CHALLENGE_COOKIE } from "@/lib/api/auth/otp/config";
import {
  hashOtpChallengeSecret,
  parseOtpChallengeCookie,
} from "@/lib/api/auth/otp/challenge-token";
import { createLoginResponse } from "@/features/auth/server/login-response";
import { LoginMode } from "@/lib/generated/prisma/enums";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    const code = String(body.code ?? "").trim();
    const parsedChallenge = parseOtpChallengeCookie(
      req.cookies.get(LOGIN_OTP_CHALLENGE_COOKIE)?.value,
    );

    if (!email || !code || !parsedChallenge) {
      return NextResponse.json(
        { ok: false, message: "Email and OTP code are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        powerType: true,
        loginMode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "Invalid OTP code." }, { status: 401 });
    }

    if (user.loginMode === LoginMode.PASSWORD_ONLY) {
      return NextResponse.json(
        {
          ok: false,
          message: "OTP verification is not required for this account.",
        },
        { status: 400 },
      );
    }

    const challenge = await prisma.oTPChallenge.findFirst({
      where: {
        id: parsedChallenge.challengeId,
        userId: user.id,
        type: "LOGIN",
        challengeTokenHash: hashOtpChallengeSecret(parsedChallenge.secret),
        consumedAt: null,
      },
    });

    if (!challenge) {
      const response = NextResponse.json(
        { ok: false, message: "Invalid or expired OTP code." },
        { status: 401 },
      );
      response.cookies.delete(LOGIN_OTP_CHALLENGE_COOKIE);
      return response;
    }

    const rules = OTP_RULES.LOGIN;
    const now = new Date();
    const expiresAt =
      challenge.expiresAt ?? new Date(new Date(challenge.createdAt).getTime() + rules.ttlMs);

    if (expiresAt < now) {
      await prisma.oTPChallenge.delete({
        where: { id: challenge.id },
      });

      const response = NextResponse.json(
        { ok: false, message: "OTP code has expired." },
        { status: 401 },
      );
      response.cookies.delete(LOGIN_OTP_CHALLENGE_COOKIE);
      return response;
    }

    if (challenge.attempts >= rules.maxAttempts) {
      await prisma.oTPChallenge.delete({
        where: { id: challenge.id },
      });

      const response = NextResponse.json(
        { ok: false, message: "Too many attempts. Please try again later." },
        { status: 429 },
      );
      response.cookies.delete(LOGIN_OTP_CHALLENGE_COOKIE);
      return response;
    }

    const codeHash = hashOtpCode(code);

    if (challenge.codeHash !== codeHash) {
      await prisma.oTPChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({ ok: false, message: "Invalid OTP code." }, { status: 401 });
    }

    await prisma.oTPChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now },
    });

    const response = await createLoginResponse(user);
    response.cookies.delete(LOGIN_OTP_CHALLENGE_COOKIE);
    return response;
  } catch (error) {
    console.error("LOGIN_OTP_ERROR:", error);

    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}

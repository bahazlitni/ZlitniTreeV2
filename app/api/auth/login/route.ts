// /api/auth/staff/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/api/auth/password";
import {
  OTP_CODE_LENGTH,
  OTP_RULES,
  LOGIN_OTP_CHALLENGE_COOKIE,
} from "@/lib/api/auth/otp/config";
import { generateOtpCode } from "@/lib/api/auth/otp/code";
import { hashOtpCode } from "@/lib/api/auth/otp/hash";
import {
  encodeOtpChallengeCookie,
  generateOtpChallengeSecret,
  hashOtpChallengeSecret,
  parseOtpChallengeCookie,
} from "@/lib/api/auth/otp/challenge-token";
import { getLocale, getTheme } from "@/lib/utils";
import { createTransporter } from "@/lib/nodemailer/create-transporter";
import { sendEmail } from "@/lib/nodemailer/send-email";
import buildLoginOtpCodeHtml from "@/lib/html-builders/buildLoginOtpCodeHtml";
import { createLoginResponse } from "@/features/auth/server/login-response";
import { Theme, Locale } from "@/lib/global-types";
import { formatMessage, getMessages } from "@/lib/i18n/messages";
import { LoginMode } from "@/lib/generated/prisma/enums";
import { shouldUseSecureAuthCookies } from "@/lib/api/auth/cookies";

export const runtime = "nodejs";

const MAX_ACTIVE_LOGIN_CHALLENGES_PER_USER = 5;

function getCooldownPayload(createdAt: Date, now: Date) {
  const resendAvailableAtMs =
    new Date(createdAt).getTime() + OTP_RULES.LOGIN.resendCooldownMs;
  const cooldownRemainingMs = Math.max(0, resendAvailableAtMs - now.getTime());

  return {
    cooldownSeconds: Math.ceil(cooldownRemainingMs / 1000),
    resendAvailableAt: new Date(resendAvailableAtMs).toISOString(),
  };
}

function setLoginChallengeCookie(
  response: NextResponse,
  req: NextRequest,
  value: string,
  maxAgeSeconds = Math.ceil(OTP_RULES.LOGIN.ttlMs / 1000),
) {
  response.cookies.set(LOGIN_OTP_CHALLENGE_COOKIE, value, {
    httpOnly: true,
    secure: shouldUseSecureAuthCookies(req),
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

function clearLoginChallengeCookie(response: NextResponse) {
  response.cookies.delete(LOGIN_OTP_CHALLENGE_COOKIE);
}

async function pruneLoginChallenges(userId: string, now: Date) {
  await prisma.oTPChallenge.deleteMany({
    where: {
      userId,
      type: "LOGIN",
      OR: [{ consumedAt: { not: null } }, { expiresAt: { lt: now } }],
    },
  });

  const staleActiveChallenges = await prisma.oTPChallenge.findMany({
    where: {
      userId,
      type: "LOGIN",
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
    skip: MAX_ACTIVE_LOGIN_CHALLENGES_PER_USER,
    select: { id: true },
  });

  if (staleActiveChallenges.length > 0) {
    await prisma.oTPChallenge.deleteMany({
      where: { id: { in: staleActiveChallenges.map((item) => item.id) } },
    });
  }
}

async function getCookieBoundLoginChallenge(req: NextRequest, userId: string) {
  const parsed = parseOtpChallengeCookie(
    req.cookies.get(LOGIN_OTP_CHALLENGE_COOKIE)?.value,
  );

  if (!parsed) {
    return null;
  }

  return prisma.oTPChallenge.findFirst({
    where: {
      id: parsed.challengeId,
      userId,
      type: "LOGIN",
      challengeTokenHash: hashOtpChallengeSecret(parsed.secret),
      consumedAt: null,
    },
  });
}

async function sendLoginOtpEmail(
  email: string,
  code: string,
  theme: Theme,
  locale: Locale,
) {
  const transporter = createTransporter();
  const t = getMessages(locale).Email.loginOtp;

  await sendEmail(transporter, {
    to: email,
    subject: t.subject,
    text: formatMessage(t.text, { code }),
    html: buildLoginOtpCodeHtml(
      code,
      OTP_RULES.LOGIN.ttlMs / 60000,
      theme,
      locale,
    ),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required" },
        { status: 400 },
      );
    }

    const theme = getTheme(body.theme);
    const locale = getLocale(body.locale);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        powerType: true,
        loginMode: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const requiresPassword = user.loginMode !== LoginMode.PASSWORDLESS;
    const requiresOtp = user.loginMode !== LoginMode.PASSWORD_ONLY;

    if (requiresPassword) {
      if (!password) {
        const response = NextResponse.json({
          ok: true,
          requiresPassword: true,
          requiresOtp,
          message: "Password is required for this account.",
        });

        clearLoginChallengeCookie(response);
        return response;
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { ok: false, message: "Invalid credentials" },
          { status: 401 },
        );
      }

      const validPassword = await verifyPassword(password, user.passwordHash);

      if (!validPassword) {
        return NextResponse.json(
          { ok: false, message: "Invalid credentials" },
          { status: 401 },
        );
      }
    }

    if (!requiresOtp) {
      const response = await createLoginResponse(user, {
        req,
        body: { requiresOtp: false },
        clearLoginOtpChallenge: true,
      });

      clearLoginChallengeCookie(response);
      return response;
    }

    const now = new Date();
    await pruneLoginChallenges(user.id, now);

    const existingChallenge = await getCookieBoundLoginChallenge(req, user.id);

    if (existingChallenge) {
      const activeExpiresAt =
        existingChallenge.expiresAt ??
        new Date(
          new Date(existingChallenge.createdAt).getTime() +
            OTP_RULES.LOGIN.ttlMs,
        );
      const cooldown = getCooldownPayload(existingChallenge.createdAt, now);

      if (activeExpiresAt > now && cooldown.cooldownSeconds > 0) {
        return NextResponse.json({
          ok: true,
          requiresOtp: true,
          message: "An OTP code is already active.",
          ...cooldown,
        });
      }

      const code = generateOtpCode(OTP_CODE_LENGTH);
      const codeHash = hashOtpCode(code);
      const expiresAt = new Date(now.getTime() + OTP_RULES.LOGIN.ttlMs);

      await prisma.oTPChallenge.update({
        where: { id: existingChallenge.id },
        data: {
          codeHash,
          attempts: 0,
          expiresAt,
          consumedAt: null,
          createdAt: now,
        },
      });

      await sendLoginOtpEmail(user.email, code, theme, locale);

      const cookieValue = req.cookies.get(LOGIN_OTP_CHALLENGE_COOKIE)?.value;
      const response = NextResponse.json({
        ok: true,
        requiresOtp: true,
        message: "The OTP code has been sent.",
        ...getCooldownPayload(now, now),
      });

      if (cookieValue) {
        setLoginChallengeCookie(response, req, cookieValue);
      }

      return response;
    }

    const secret = generateOtpChallengeSecret();
    const code = generateOtpCode(OTP_CODE_LENGTH);
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(now.getTime() + OTP_RULES.LOGIN.ttlMs);
    const challenge = await prisma.oTPChallenge.create({
      data: {
        userId: user.id,
        type: "LOGIN",
        codeHash,
        challengeTokenHash: hashOtpChallengeSecret(secret),
        expiresAt,
      },
      select: { id: true },
    });

    await pruneLoginChallenges(user.id, now);
    await sendLoginOtpEmail(user.email, code, theme, locale);

    const response = NextResponse.json({
      ok: true,
      requiresOtp: true,
      message: "The OTP code has been sent.",
      ...getCooldownPayload(now, now),
    });

    setLoginChallengeCookie(
      response,
      req,
      encodeOtpChallengeCookie(challenge.id, secret),
    );

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

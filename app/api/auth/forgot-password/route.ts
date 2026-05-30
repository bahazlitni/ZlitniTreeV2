import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getLocale, getTheme } from "@/lib/utils";
import { createTransporter } from "@/lib/nodemailer/create-transporter";
import { sendEmail } from "@/lib/nodemailer/send-email";
import buildPasswordResetHtml from "@/lib/html-builders/buildPasswordResetHtml";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/lib/api/auth/password-reset-token";
import { PASSWORD_RESET_TOKEN_TTL_MS } from "@/lib/api/auth/otp/config";
import type { Locale, Theme } from "@/lib/global-types";
import { formatMessage, getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";

async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  theme: Theme,
  locale: Locale,
) {
  const transporter = createTransporter();
  const t = getMessages(locale).Email.passwordReset;

  await sendEmail(transporter, {
    to: email,
    subject: t.subject,
    text: formatMessage(t.text, { url: resetUrl }),
    html: buildPasswordResetHtml(
      resetUrl,
      PASSWORD_RESET_TOKEN_TTL_MS / 60000,
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

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required." },
        { status: 400 },
      );
    }

    const locale = getLocale(body.locale);
    const theme = getTheme(body.theme);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (user) {
      const now = new Date();
      const token = generatePasswordResetToken();
      const tokenHash = hashPasswordResetToken(token);
      const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
      const resetUrl = new URL(`/${locale}/reset-password`, req.nextUrl.origin);

      resetUrl.searchParams.set("token", token);

      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: {
            userId: user.id,
            consumedAt: null,
          },
          data: { consumedAt: now },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        }),
      ]);

      await sendPasswordResetEmail(user.email, resetUrl.toString(), theme, locale);
    }

    return NextResponse.json({
      ok: true,
      message: "If this account exists, a password reset email has been sent.",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

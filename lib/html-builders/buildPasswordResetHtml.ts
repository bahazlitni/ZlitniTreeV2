import { getMessages, formatMessage } from "@/lib/i18n/messages";
import { escapeHtml } from "@/lib/utils";
import type { Locale, Theme } from "@/lib/global-types";

export default function buildPasswordResetHtml(
  resetUrl: string,
  expiresInMinutes: number,
  theme: Theme = "dark",
  locale: Locale = "en",
) {
  const isDark = theme === "dark";
  const isArabic = locale === "ar";
  const messages = getMessages(locale);
  const t = messages.Email.passwordReset;
  const minutes = Math.ceil(expiresInMinutes);

  const colors = {
    pageBg: isDark ? "#080909" : "#f6f7f6",
    cardBg: isDark ? "#121313" : "#ffffff",
    sectionBg: isDark ? "#171918" : "#f2f5f2",
    border: isDark ? "#2a2d2b" : "#d9ded9",
    text: isDark ? "#f4f4f5" : "#111311",
    muted: isDark ? "#a1a1aa" : "#5f6b61",
    primary: isDark ? "#22c55e" : "#16a34a",
    buttonBg: isDark ? "#052e16" : "#dcfce7",
    buttonBorder: isDark ? "#166534" : "#86efac",
    buttonText: isDark ? "#bbf7d0" : "#14532d",
  };

  return `<!doctype html>
<html lang="${locale}" dir="${isArabic ? "rtl" : "ltr"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(t.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${colors.pageBg};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${colors.pageBg};padding:36px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:${colors.cardBg};border:1px solid ${colors.border};border-radius:22px;overflow:hidden;box-shadow:0 22px 48px rgba(0,0,0,0.18);">
            <tr>
              <td style="height:3px;background:${colors.primary};font-size:1px;line-height:1px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:34px 38px 26px;text-align:${isArabic ? "right" : "left"};">
                <div style="font-size:18px;font-weight:700;color:${colors.primary};">${escapeHtml(messages.Common.brand)}</div>
                <h1 style="margin:18px 0 0;font-size:34px;line-height:1.18;font-weight:800;color:${colors.text};letter-spacing:0;">
                  ${escapeHtml(t.title)}
                </h1>
              </td>
            </tr>
            <tr><td style="height:1px;background:${colors.border};font-size:1px;line-height:1px;">&nbsp;</td></tr>
            <tr>
              <td style="padding:32px 38px 38px;text-align:${isArabic ? "right" : "left"};">
                <p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:${colors.muted};">
                  ${escapeHtml(t.subtitle)}
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:12px;background:${colors.buttonBg};border:1px solid ${colors.buttonBorder};">
                      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:13px 18px;color:${colors.buttonText};font-size:15px;font-weight:800;text-decoration:none;">
                        ${escapeHtml(t.action)}
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:28px;border:1px solid ${colors.border};border-radius:16px;background:${colors.sectionBg};padding:18px 20px;font-size:14px;line-height:1.7;color:${colors.muted};">
                  ${escapeHtml(formatMessage(t.expires, { minutes }))}
                </div>
              </td>
            </tr>
            <tr><td style="height:1px;background:${colors.border};font-size:1px;line-height:1px;">&nbsp;</td></tr>
            <tr>
              <td style="padding:24px 38px 32px;text-align:${isArabic ? "right" : "left"};">
                <p style="margin:0;font-size:14px;line-height:1.7;color:${colors.muted};">
                  ${escapeHtml(t.footer)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

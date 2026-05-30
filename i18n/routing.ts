import { defineRouting } from "next-intl/routing";

import type { Locale } from "@/lib/global-types";

export const locales = ["en", "fr", "ar"] as const satisfies readonly Locale[];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

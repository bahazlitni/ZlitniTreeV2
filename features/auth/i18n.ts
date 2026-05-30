import type { Locale } from "@/lib/global-types";

export { getDirection, isLocale } from "@/i18n/routing";
export { locales as LOCALES } from "@/i18n/routing";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

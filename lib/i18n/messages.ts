import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { Locale } from "@/lib/global-types";

const messagesByLocale = {
  en,
  fr,
  ar,
} satisfies Record<Locale, typeof en>;

export type AppMessages = typeof en;

export function getMessages(locale: Locale): AppMessages {
  return messagesByLocale[locale] ?? messagesByLocale.en;
}

export function formatMessage(
  message: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

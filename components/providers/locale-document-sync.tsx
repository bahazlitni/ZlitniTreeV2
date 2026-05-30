"use client";

import { useEffect } from "react";

import { getDirection } from "@/i18n/routing";
import type { Locale } from "@/lib/global-types";

export function LocaleDocumentSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return null;
}

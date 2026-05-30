import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Theme, Locale } from "./global-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getLocale(x: unknown): Locale {
  if(typeof x === "string"){
    return x === "fr" ? "fr" : x === "ar" ? "ar" : "en";
  }
  return "en";
}

export function getTheme(x: unknown): Theme {
  if(typeof x === "string"){
    return x === "dark" ? "dark" : "light";
  }
  return "light";
}

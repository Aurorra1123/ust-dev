import type { Locale } from "../store/locale-store";

export function isEnglishLocale(locale: Locale) {
  return locale === "en";
}

import type { Locale } from "../store/locale-store";

export function isEnglishLocale(locale: Locale) {
  return locale === "en";
}

export function localeText(locale: Locale, zhCN: string, en: string) {
  return isEnglishLocale(locale) ? en : zhCN;
}

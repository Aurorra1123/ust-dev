import { create } from "zustand";

export type Locale = "zh-CN" | "en";

const LOCALE_STORAGE_KEY = "campusbook.locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "zh-CN";
  }

  return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "en" ? "en" : "zh-CN";
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }

    set({
      locale
    });
  }
}));

import type { Locale } from "../store/locale-store";
import { useLocaleStore } from "../store/locale-store";

function resolveLocale(locale?: Locale): Locale {
  if (locale) {
    return locale;
  }

  if (typeof window === "undefined") {
    return "zh-CN";
  }

  return useLocaleStore.getState().locale;
}

function resolveIntlLocale(locale?: Locale) {
  return resolveLocale(locale) === "en" ? "en-US" : "zh-CN";
}

function notSetText(locale?: Locale) {
  return resolveLocale(locale) === "en" ? "Not set" : "未设置";
}

export function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function formatDateTime(value?: string | null, locale?: Locale) {
  if (!value) {
    return notSetText(locale);
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function formatDate(value?: string | null, locale?: Locale) {
  if (!value) {
    return notSetText(locale);
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(new Date(value));
}

export function formatTime(value?: string | null, locale?: Locale) {
  if (!value) {
    return notSetText(locale);
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export function startOfHour(base = new Date()) {
  const next = new Date(base);
  next.setMinutes(0, 0, 0);
  return next;
}

export function startOfNextHour(base = new Date()) {
  const next = startOfHour(base);
  next.setHours(next.getHours() + 1);
  return next;
}

export function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

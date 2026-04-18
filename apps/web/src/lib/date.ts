export function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "未设置";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function startOfNextHour(base = new Date()) {
  const next = new Date(base);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

export function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

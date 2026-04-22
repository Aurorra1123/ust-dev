import type { PublicResourceReservationStatusResponse } from "@campusbook/shared-types";

import { formatDateTime } from "../../../lib/date";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export function ResourceClosuresCard({
  locale,
  schedule
}: {
  locale: Locale;
  schedule: PublicResourceReservationStatusResponse | undefined;
}) {
  return (
    <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
        {localeText(locale, "资源关闭区间", "Resource Closures")}
      </p>
      {schedule?.closures.length ? (
        <div className="mt-3 grid gap-2">
          {schedule.closures.slice(0, 4).map((closure) => (
            <div
              key={`${closure.startsAt}-${closure.endsAt ?? "open"}`}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-slate"
            >
              <p>
                {formatDateTime(closure.startsAt)} {" → "}{" "}
                {closure.endsAt
                  ? formatDateTime(closure.endsAt)
                  : localeText(locale, "长期关闭", "Open-ended")}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                {closure.reason ||
                  localeText(locale, "未填写关闭原因", "No closure reason recorded")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate">
          {localeText(locale, "当前时间窗内没有关闭区间。", "No closure periods in the current window.")}
        </p>
      )}
    </div>
  );
}

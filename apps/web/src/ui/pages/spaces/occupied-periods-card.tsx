import type { PublicResourceReservationRecord } from "@campusbook/shared-types";

import { formatDateTime } from "../../../lib/date";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export function OccupiedPeriodsCard({
  locale,
  reservations
}: {
  locale: Locale;
  reservations: PublicResourceReservationRecord[];
}) {
  return (
    <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
        {localeText(locale, "当前单元已占用", "Occupied Periods")}
      </p>
      {reservations.length ? (
        <div className="mt-3 grid gap-2">
          {reservations.slice(0, 5).map((reservation) => (
            <div
              key={`${reservation.orderId}-${reservation.startTime}`}
              className="rounded-2xl bg-white px-4 py-3 text-sm text-slate"
            >
              {formatDateTime(reservation.startTime)} {" → "} {formatDateTime(reservation.endTime)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate">
          {localeText(locale, "当前时间窗内没有已占用记录。", "No occupied periods in the current window.")}
        </p>
      )}
    </div>
  );
}

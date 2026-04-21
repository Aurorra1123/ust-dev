import type { AdminResourceReservationRecord } from "@campusbook/shared-types";

import { formatDateTime } from "../../../../lib/date";
import { localeText } from "../../../../lib/locale";
import type { Locale } from "../../../../store/locale-store";
import { StatusPill } from "../../../user-experience-kit";
import { orderStatusLabel } from "../admin-helpers";

export function ReservationStatusList({
  title,
  entries,
  onCancel,
  locale,
  isMutating
}: {
  title: string;
  entries: AdminResourceReservationRecord[];
  onCancel: (orderId: string) => void;
  locale: Locale;
  isMutating: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-navy/10 bg-sand px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-ink">{title}</h4>
        <StatusPill>{localeText(locale, `${entries.length} 条`, `${entries.length}`)}</StatusPill>
      </div>
      <div className="mt-4 grid gap-3">
        {entries.length ? (
          entries.map((entry) => (
            <div key={`${entry.orderId}-${entry.startTime}`} className="rounded-2xl bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{entry.resourceUnitName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">
                    {entry.orderNo}
                  </p>
                </div>
                <StatusPill tone={entry.status === "confirmed" ? "success" : entry.status === "no_show" ? "danger" : "neutral"}>
                  {orderStatusLabel(entry.status, locale)}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm text-slate">
                {entry.userEmail} · {formatDateTime(entry.startTime)} {" → "} {formatDateTime(entry.endTime)}
              </p>
              <p className="mt-2 text-sm text-slate">
                {localeText(
                  locale,
                  `同行人数 ${entry.participantCount}，已签到 ${entry.checkedInCount}`,
                  `${entry.participantCount} participants, ${entry.checkedInCount} checked in`
                )}
              </p>
              {entry.status === "confirmed" ? (
                <button
                  type="button"
                  className="mt-4 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:bg-danger/50"
                  onClick={() => {
                    if (
                      !window.confirm(
                        localeText(
                          locale,
                          "确认要取消这条预约吗？该操作会直接影响用户当前订单状态。",
                          "Cancel this reservation? This will immediately change the user's order status."
                        )
                      )
                    ) {
                      return;
                    }

                    onCancel(entry.orderId);
                  }}
                  disabled={isMutating}
                >
                  {localeText(locale, "取消预约", "Cancel reservation")}
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/12 px-4 py-4 text-sm text-slate">
            {localeText(locale, "当前时间窗口内没有预约记录。", "No reservation records in the selected time window.")}
          </div>
        )}
      </div>
    </div>
  );
}

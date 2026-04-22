import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { formatDateTime } from "../../../../../lib/date";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatusPill } from "../../../../user-experience-kit";
import { activityStatusLabel } from "../../admin-helpers";
import { AdminInfoCard } from "../../components/admin-info-card";

export function SelectedActivitySummary({
  locale,
  activity
}: {
  locale: Locale;
  activity: ActivityDetailResponse;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-navy/10 bg-white">
      <div className="border-b border-navy/10 bg-gradient-to-r from-navy via-[#0d3f82] to-moss px-5 py-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">
          {localeText(locale, "当前活动", "Selected Activity")}
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{activity.title}</h3>
        <p className="mt-2 text-sm text-white/80">
          {activity.location || localeText(locale, "活动地点待补充", "Location to be added")}
        </p>
      </div>
      <div className="px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="brand">{activityStatusLabel(activity.status, locale)}</StatusPill>
          <StatusPill tone="success">
            {localeText(
              locale,
              `${activity.tickets.length} 个票种`,
              `${activity.tickets.length} ticket types`
            )}
          </StatusPill>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <AdminInfoCard
            label={localeText(locale, "开售时间", "Sales Start")}
            value={formatDateTime(activity.saleStartTime)}
          />
          <AdminInfoCard
            label={localeText(locale, "停售时间", "Sales End")}
            value={formatDateTime(activity.saleEndTime)}
          />
          <AdminInfoCard
            label={localeText(locale, "票种数量", "Ticket Types")}
            value={String(activity.tickets.length)}
          />
          <AdminInfoCard
            label={localeText(locale, "总额度", "Total Quota")}
            value={String(activity.totalQuota)}
          />
        </div>
        <div className="mt-5 grid gap-3">
          {activity.tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-2xl border border-navy/10 bg-sand px-4 py-4">
              <p className="font-medium text-ink">{ticket.name}</p>
              <p className="mt-2 text-sm text-slate">
                {localeText(
                  locale,
                  `库存 ${ticket.stock} / 已保留 ${ticket.reserved}`,
                  `Stock ${ticket.stock} / Reserved ${ticket.reserved}`
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

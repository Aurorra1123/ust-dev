import type { ActivityListItem } from "@campusbook/shared-types";

import { formatDateTime } from "../../../lib/date";
import { localeText } from "../../../lib/locale";
import { StatusPill } from "../../user-experience-kit";
import { activityStatusLabel, isActivitySoldOut } from "./activities-page-selectors";

export function ActivityOverviewCard({
  activity,
  locale
}: {
  activity: ActivityListItem;
  locale: "zh-CN" | "en";
}) {
  const soldOut = isActivitySoldOut(activity);

  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <h3 className="text-2xl font-semibold text-ink">{activity.title}</h3>
      <p className="mt-2 text-sm text-slate">
        {activity.location || localeText(locale, "活动地点待补充", "Location to be added")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone="brand">
          {activityStatusLabel(activity.status, locale)}
        </StatusPill>
        <StatusPill tone={soldOut ? "danger" : "success"}>
          {soldOut
            ? localeText(locale, "名额紧张", "Limited Seats")
            : localeText(locale, "可报名", "Available")}
        </StatusPill>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate">
        {activity.description ||
          localeText(locale, "当前活动暂无补充描述。", "No description yet.")}
      </p>
      <p className="mt-3 text-sm font-medium text-ink">
        {soldOut
          ? localeText(
              locale,
              "当前活动名额已满，需等待释放或改选其他场次。",
              "This activity is sold out. Wait for quota to be released or choose another event."
            )
          : localeText(
              locale,
              `当前剩余 ${activity.remainingQuota} 个名额。`,
              `${activity.remainingQuota} seats are currently available.`
            )}
      </p>
      <p className="mt-3 text-sm text-slate">
        {localeText(
          locale,
          `开售 ${formatDateTime(activity.saleStartTime)} · 停售 ${formatDateTime(activity.saleEndTime)}`,
          `Sales ${formatDateTime(activity.saleStartTime)} · End ${formatDateTime(activity.saleEndTime)}`
        )}
      </p>
    </div>
  );
}

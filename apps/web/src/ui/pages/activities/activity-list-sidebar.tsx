import type { ActivityListItem } from "@campusbook/shared-types";

import { localeText } from "../../../lib/locale";
import { activityStatusLabel } from "./activities-page-selectors";

function ActivityCard({
  activity,
  active,
  onSelect,
  locale
}: {
  activity: ActivityListItem;
  active: boolean;
  onSelect: () => void;
  locale: "zh-CN" | "en";
}) {
  return (
    <button
      type="button"
      className={`rounded-[24px] border px-4 py-4 text-left transition ${
        active ? "border-ember bg-ember/10" : "border-ink/10 bg-white hover:border-moss"
      }`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={localeText(
        locale,
        `${activity.title}，${activityStatusLabel(activity.status, locale)}${
          active ? "，当前查看中" : ""
        }`,
        `${activity.title}, ${activityStatusLabel(activity.status, locale)}${
          active ? ", currently selected" : ""
        }`
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-moss">
          {activityStatusLabel(activity.status, locale)}
        </p>
        {active ? (
          <span className="rounded-full bg-ember px-2 py-1 text-[11px] font-medium text-white">
            {localeText(locale, "当前查看", "Selected")}
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-lg font-semibold text-ink">{activity.title}</h3>
      <p className="mt-2 text-sm text-ink/70">
        {activity.location || localeText(locale, "线上/待定", "Online / TBD")}
      </p>
    </button>
  );
}

export function ActivityListSidebar({
  activities,
  selectedActivityId,
  locale,
  onSelect
}: {
  activities: ActivityListItem[];
  selectedActivityId?: string;
  locale: "zh-CN" | "en";
  onSelect: (activityId: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          active={activity.id === selectedActivityId}
          onSelect={() => onSelect(activity.id)}
          locale={locale}
        />
      ))}
    </div>
  );
}

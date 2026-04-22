import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { formatDateTime } from "../../../../../lib/date";
import { getErrorMessage } from "../../../../../lib/http/errors";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatePanel } from "../../../../user-experience-kit";
import { activityStatusLabel } from "../../admin-helpers";

export function ActivityListPanel({
  locale,
  activities,
  selectedActivityId,
  isLoading,
  isError,
  error,
  onSelect
}: {
  locale: Locale;
  activities: ActivityDetailResponse[] | undefined;
  selectedActivityId: string | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onSelect: (activityId: string) => void;
}) {
  if (isLoading) {
    return (
      <StatePanel
        tone="loading"
        title={localeText(locale, "正在载入活动管理", "Loading activity management")}
        description={localeText(
          locale,
          "正在载入活动和票种信息。",
          "Loading activities and ticket information."
        )}
      />
    );
  }

  if (isError) {
    return (
      <StatePanel
        tone="danger"
        title={localeText(locale, "活动管理暂时无法加载", "Activity management is unavailable")}
        description={getErrorMessage(error)}
      />
    );
  }

  return (
    <>
      {activities?.map((activity) => (
        <button
          key={activity.id}
          type="button"
          className={`rounded-[26px] border px-5 py-5 text-left transition ${
            activity.id === selectedActivityId
              ? "border-ember bg-gradient-to-br from-ember/10 to-white"
              : "border-ink/10 bg-white hover:border-moss"
          }`}
          onClick={() => onSelect(activity.id)}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                {activityStatusLabel(activity.status, locale)}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-ink">{activity.title}</h3>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/75">
              {localeText(
                locale,
                `${activity.tickets.length} 个票种`,
                `${activity.tickets.length} ticket types`
              )}
            </span>
          </div>
          <p className="mt-3 text-sm text-ink/70">
            {formatDateTime(activity.saleStartTime)} - {formatDateTime(activity.saleEndTime)}
          </p>
        </button>
      ))}
    </>
  );
}

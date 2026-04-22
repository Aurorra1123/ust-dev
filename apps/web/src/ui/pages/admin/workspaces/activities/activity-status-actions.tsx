import type { ActivityDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { MutationState } from "../../components/mutation-state";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function ActivityStatusActions({
  locale,
  selectedActivity,
  mutation,
  onPublish,
  onClose
}: {
  locale: Locale;
  selectedActivity: ActivityDetailResponse | null;
  mutation: MutationStateLike;
  onPublish: () => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <h3 className="text-lg font-semibold text-ink">
        {localeText(locale, "活动状态切换", "Activity Status")}
      </h3>
      <p className="mt-2 text-sm text-ink/70">
        {localeText(locale, "当前活动：", "Current activity: ")}
        {selectedActivity?.title ||
          localeText(locale, "请先选择左侧活动", "Select an activity from the left")}
      </p>
      <MutationState
        mutation={mutation}
        success={localeText(locale, "活动状态已更新。", "Activity status updated.")}
        pending={localeText(locale, "正在更新活动状态。", "Updating activity status.")}
      />
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-full border border-ember/25 px-4 py-3 text-sm text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedActivity || mutation.isPending}
          onClick={onPublish}
        >
          {localeText(locale, "发布", "Publish")}
        </button>
        <button
          type="button"
          className="flex-1 rounded-full border border-ink/15 px-4 py-3 text-sm text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedActivity || mutation.isPending}
          onClick={onClose}
        >
          {localeText(locale, "关闭", "Close")}
        </button>
      </div>
    </div>
  );
}

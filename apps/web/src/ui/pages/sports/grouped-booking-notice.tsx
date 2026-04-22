import type { ResourceDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import { formatNameList } from "./sports-helpers";

export function GroupedBookingNotice({
  locale,
  selectedGroup,
  selectedGroupMemberNames
}: {
  locale: Locale;
  selectedGroup: ResourceDetailResponse["groups"][number] | null;
  selectedGroupMemberNames: string[];
}) {
  if (!selectedGroup) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-ember/15 bg-[#fff7ef] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
        {localeText(locale, "组合说明", "Grouped Booking")}
      </p>
      <p className="mt-3 text-sm font-semibold text-ink">{selectedGroup.name}</p>
      <p className="mt-2 text-sm text-slate">
        {selectedGroup.description ||
          localeText(
            locale,
            "该组合用于一次性锁定一组关联场地。",
            "This set is used to reserve multiple linked courts in one booking."
          )}
      </p>
      <div className="mt-4 grid gap-3 text-sm text-slate">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
            {localeText(locale, "成员场地", "Included Courts")}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            {formatNameList(selectedGroupMemberNames, locale)}
          </p>
        </div>
        <p>
          {localeText(
            locale,
            "选择一个时段会同时占用整组场地；只要其中任一成员场地已占用、进行中或关闭，该时段就不能选。",
            "Selecting one slot reserves the entire set. If any included court is occupied, in progress, or closed, that slot cannot be chosen."
          )}
        </p>
      </div>
    </div>
  );
}

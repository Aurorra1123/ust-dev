import { formatDateTime } from "../../../lib/date";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import { formatNameList } from "./sports-helpers";

export function SelectedSlotsCard({
  locale,
  slotStarts,
  onToggleSlot,
  selectedGroupMemberNames,
  showGroupEffect
}: {
  locale: Locale;
  slotStarts: string[];
  onToggleSlot: (slotStartIso: string) => void;
  selectedGroupMemberNames: string[];
  showGroupEffect: boolean;
}) {
  return (
    <>
      <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
          {localeText(locale, "已选时段", "Selected Slots")}
        </p>
        {slotStarts.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {slotStarts.map((slotStartIso) => (
              <button
                key={slotStartIso}
                type="button"
                className="rounded-full bg-ember/10 px-3 py-2 text-xs text-ember"
                onClick={() => onToggleSlot(slotStartIso)}
                aria-label={localeText(
                  locale,
                  `移除已选时段 ${formatDateTime(slotStartIso)}`,
                  `Remove selected slot ${formatDateTime(slotStartIso)}`
                )}
              >
                {formatDateTime(slotStartIso)}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate">
            {localeText(locale, "请在时间表中选择时段。", "Select time slots from the table.")}
          </p>
        )}
      </div>

      {showGroupEffect ? (
        <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
            {localeText(locale, "提交效果", "Booking Effect")}
          </p>
          <p className="mt-3 text-sm text-slate">
            {localeText(
              locale,
              `提交后会同时预约 ${formatNameList(selectedGroupMemberNames, locale)}。`,
              `Submitting will reserve ${formatNameList(selectedGroupMemberNames, locale)} together.`
            )}
          </p>
        </div>
      ) : null}
    </>
  );
}

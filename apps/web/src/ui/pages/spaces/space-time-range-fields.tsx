import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export function SpaceTimeRangeFields({
  locale,
  startTime,
  endTime,
  hasValidationError,
  onStartTimeChange,
  onEndTimeChange
}: {
  locale: Locale;
  startTime: string;
  endTime: string;
  hasValidationError: boolean;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}) {
  return (
    <>
      <label className="grid gap-2 text-sm text-ink/75" htmlFor="spaces-start-time">
        {localeText(locale, "开始时间", "Start Time")}
        <input
          id="spaces-start-time"
          className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          type="datetime-local"
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
          aria-invalid={hasValidationError}
          aria-describedby="spaces-booking-time-help spaces-booking-validation-message"
        />
      </label>

      <label className="grid gap-2 text-sm text-ink/75" htmlFor="spaces-end-time">
        {localeText(locale, "结束时间", "End Time")}
        <input
          id="spaces-end-time"
          className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          type="datetime-local"
          value={endTime}
          onChange={(event) => onEndTimeChange(event.target.value)}
          aria-invalid={hasValidationError}
          aria-describedby="spaces-booking-time-help spaces-booking-validation-message"
        />
      </label>

      <p id="spaces-booking-time-help" className="text-xs leading-6 text-slate">
        {localeText(
          locale,
          "时间输入框支持键盘直接录入，结束时间必须晚于开始时间；若当前视图没有覆盖所选时段，可使用下方按钮对齐。",
          "Use the keyboard to enter time directly. The end time must be later than the start time. If the current timeline window does not cover your selection, align it with the button below."
        )}
      </p>
    </>
  );
}

import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export type BookingTarget = {
  id: string;
  label: string;
  detail: string;
};

export function SportsTargetSelect({
  locale,
  targetId,
  availableTargets,
  onTargetChange
}: {
  locale: Locale;
  targetId: string;
  availableTargets: BookingTarget[];
  onTargetChange: (targetId: string) => void;
}) {
  return (
    <>
      <label className="grid gap-2 text-sm text-ink/75" htmlFor="sports-booking-target">
        {localeText(locale, "目标", "Target")}
        <select
          id="sports-booking-target"
          className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          value={targetId}
          onChange={(event) => onTargetChange(event.target.value)}
          aria-describedby="sports-target-help"
        >
          {availableTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label} · {target.detail}
            </option>
          ))}
        </select>
      </label>
      <p id="sports-target-help" className="text-xs leading-6 text-slate">
        {localeText(
          locale,
          "键盘可用方向键切换目标，在时间表中用 Tab 聚焦时段按钮并按 Enter 或 Space 选择。",
          "Use the arrow keys to switch targets. In the schedule, focus slot buttons with Tab and select them with Enter or Space."
        )}
      </p>
    </>
  );
}

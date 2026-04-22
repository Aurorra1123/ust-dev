import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import {
  legendToneClass,
  type CellState
} from "./sports-helpers";

function SportsLegendItem({
  label,
  tone
}: {
  label: string;
  tone: CellState;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-4 w-4 rounded-full ${legendToneClass(tone)}`} />
      <span>{label}</span>
    </div>
  );
}

export function SportsLegendCard({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
        {localeText(locale, "状态说明", "Legend")}
      </p>
      <div className="mt-3 grid gap-2 text-sm text-slate">
        <SportsLegendItem label={localeText(locale, "可预约", "Available")} tone="available" />
        <SportsLegendItem label={localeText(locale, "已占用", "Occupied")} tone="occupied" />
        <SportsLegendItem label={localeText(locale, "进行中", "In Progress")} tone="in_progress" />
        <SportsLegendItem label={localeText(locale, "已选中", "Selected")} tone="selected" />
        <SportsLegendItem label={localeText(locale, "不可约", "Closed")} tone="closed" />
      </div>
    </div>
  );
}

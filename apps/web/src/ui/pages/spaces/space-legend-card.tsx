import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import { SpacesLegendItem } from "./spaces-availability-panel";

export function SpaceLegendCard({ locale }: { locale: Locale }) {
  return (
    <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
        {localeText(locale, "状态说明", "Legend")}
      </p>
      <div className="mt-3 grid gap-2 text-sm text-slate">
        <SpacesLegendItem label={localeText(locale, "可预约区间", "Available")} tone="available" />
        <SpacesLegendItem label={localeText(locale, "已占用区间", "Occupied")} tone="occupied" />
        <SpacesLegendItem label={localeText(locale, "当前进行中", "In Progress")} tone="current" />
        <SpacesLegendItem label={localeText(locale, "关闭区间", "Closed")} tone="closed" />
        <SpacesLegendItem label={localeText(locale, "当前选择", "Selection")} tone="selection" />
      </div>
    </div>
  );
}

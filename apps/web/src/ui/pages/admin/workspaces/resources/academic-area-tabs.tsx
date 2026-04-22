import type { AcademicAreaGroup } from "./resources-workspace-helpers";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";

export function AcademicAreaTabs({
  locale,
  groups,
  activeKey,
  onSelect
}: {
  locale: Locale;
  groups: AcademicAreaGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  if (!groups.length) {
    return null;
  }

  return (
    <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
      <p className="text-xs uppercase tracking-[0.2em] text-moss">
        {localeText(locale, "区域索引", "Area Index")}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink">
        {localeText(locale, "按区域查看学术空间", "Browse Academic Spaces by Area")}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {groups.map((group) => (
          <button
            key={group.key}
            type="button"
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeKey === group.key
                ? "border-ember bg-ember text-white"
                : "border-navy/10 bg-sand text-ink hover:border-moss"
            }`}
            onClick={() => onSelect(group.key)}
          >
            {group.label} · {group.resources.length}
          </button>
        ))}
      </div>
    </div>
  );
}

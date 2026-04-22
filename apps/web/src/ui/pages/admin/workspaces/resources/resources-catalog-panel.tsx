import type { AdminResourceDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatusPill } from "../../../../user-experience-kit";
import { resourceTypeLabel } from "../../admin-helpers";

export function ResourcesCatalogPanel({
  locale,
  resources,
  selectedResourceId,
  onSelectResource
}: {
  locale: Locale;
  resources: AdminResourceDetailResponse[];
  selectedResourceId: string | null;
  onSelectResource: (resourceId: string) => void;
}) {
  return resources.map((resource) => (
    <button
      key={resource.id}
      type="button"
      className={`rounded-[26px] border px-5 py-5 text-left transition ${
        resource.id === selectedResourceId
          ? "border-ember bg-gradient-to-br from-ember/10 to-white"
          : "border-ink/10 bg-white hover:border-moss"
      }`}
      onClick={() => onSelectResource(resource.id)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-moss">
            {resourceTypeLabel(resource.type, locale)}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{resource.name}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={resource.status === "active" ? "success" : "danger"}>
            {resource.status === "active"
              ? localeText(locale, "启用中", "Active")
              : localeText(locale, "已停用", "Inactive")}
          </StatusPill>
          {resource.units.length === 0 ? (
            <StatusPill tone="danger">
              {localeText(locale, "未配置单元", "No Units")}
            </StatusPill>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm text-ink/70">
        {resource.code} · {resource.location || localeText(locale, "未填写位置", "No location")}
      </p>
      <p className="mt-2 text-xs text-ink/55">
        {localeText(locale, `${resource.units.length} 个资源单元`, `${resource.units.length} units`)}
      </p>
    </button>
  ));
}

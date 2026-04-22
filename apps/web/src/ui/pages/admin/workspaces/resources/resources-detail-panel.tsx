import type { AdminResourceDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatePanel, StatusPill } from "../../../../user-experience-kit";
import {
  availabilityModeLabel,
  resourceTypeLabel
} from "../../admin-helpers";
import { AdminInfoCard } from "../../components/admin-info-card";
import { MutationState } from "../../components/mutation-state";
import { formatResourceMutationError } from "./resources-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function ResourcesDetailPanel({
  locale,
  selectedResource,
  selectedUnitId,
  onSelectUnit,
  onToggleResourceStatus,
  onDeleteResource,
  onDeleteResourceUnit,
  updateResourceStatusMutation,
  deleteResourceMutation,
  deleteResourceUnitMutation
}: {
  locale: Locale;
  selectedResource: AdminResourceDetailResponse | null;
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  onToggleResourceStatus: () => void;
  onDeleteResource: () => void;
  onDeleteResourceUnit: (unitId: string) => void;
  updateResourceStatusMutation: MutationStateLike;
  deleteResourceMutation: MutationStateLike;
  deleteResourceUnitMutation: MutationStateLike;
}) {
  if (!selectedResource) {
    return null;
  }

  return (
    <>
      <div className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-sand via-white to-mist px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-moss">
              {localeText(locale, "当前资源", "Selected Resource")}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{selectedResource.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="brand">
              {resourceTypeLabel(selectedResource.type, locale)}
            </StatusPill>
            <StatusPill tone={selectedResource.status === "active" ? "success" : "danger"}>
              {selectedResource.status === "active"
                ? localeText(locale, "启用中", "Active")
                : localeText(locale, "已停用", "Inactive")}
            </StatusPill>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-moss/25 px-4 py-2 text-sm text-moss transition hover:bg-moss/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onToggleResourceStatus}
            disabled={updateResourceStatusMutation.isPending}
          >
            {selectedResource.status === "active"
              ? localeText(locale, "停用资源", "Deactivate Resource")
              : localeText(locale, "重新启用", "Reactivate Resource")}
          </button>
          <button
            type="button"
            className="rounded-full border border-danger/25 px-4 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onDeleteResource}
            disabled={deleteResourceMutation.isPending}
          >
            {localeText(locale, "删除资源", "Delete Resource")}
          </button>
        </div>

        <MutationState
          mutation={updateResourceStatusMutation}
          pending={localeText(locale, "正在更新资源状态。", "Updating resource status.")}
          success={localeText(locale, "资源状态已更新。", "Resource status updated.")}
        />
        <MutationState
          mutation={deleteResourceMutation}
          pending={localeText(locale, "正在删除资源。", "Deleting resource.")}
          success={localeText(locale, "资源已删除。", "Resource deleted.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />

        <p className="mt-4 text-sm leading-7 text-slate">
          {selectedResource.description ||
            localeText(
              locale,
              "当前资源暂无补充描述。",
              "No additional description for this resource yet."
            )}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminInfoCard
            label={localeText(locale, "资源编码", "Resource Code")}
            value={selectedResource.code}
          />
          <AdminInfoCard
            label={localeText(locale, "当前位置", "Location")}
            value={selectedResource.location || localeText(locale, "未填写", "Not set")}
          />
          <AdminInfoCard
            label={localeText(locale, "资源单元", "Units")}
            value={localeText(
              locale,
              `${selectedResource.units.length} 个`,
              `${selectedResource.units.length}`
            )}
          />
          <AdminInfoCard
            label={localeText(locale, "当前状态", "Current Status")}
            value={
              selectedResource.status === "active"
                ? localeText(locale, "已启用", "Active")
                : localeText(locale, "已停用", "Inactive")
            }
          />
        </div>
      </div>

      <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">
              {localeText(locale, "资源单元维护", "Resource Unit Maintenance")}
            </h3>
            <p className="mt-2 text-sm text-slate">
              {localeText(
                locale,
                "点击某张单元卡片后，右侧会切到该单元的编辑表单。这里继续保留删除入口，但编辑动作统一放到右侧执行。",
                "Click a unit card to switch the form on the right to that unit. Deletion stays here, while editing is handled on the right."
              )}
            </p>
          </div>
          <StatusPill tone={selectedResource.units.length === 0 ? "danger" : "success"}>
            {selectedResource.units.length === 0
              ? localeText(locale, "未配置单元", "No Units")
              : localeText(
                  locale,
                  `${selectedResource.units.length} 个单元`,
                  `${selectedResource.units.length} units`
                )}
          </StatusPill>
        </div>

        {selectedResource.units.length === 0 ? (
          <div className="mt-5">
            <StatePanel
              tone="danger"
              title={localeText(
                locale,
                "该资源还没有可预约单元",
                "This resource has no bookable units yet"
              )}
              description={localeText(
                locale,
                "资源虽然已创建，但当前不会在学生端形成可预约时间轴。请先补资源单元，再决定是否继续保持启用。",
                "The resource exists, but it cannot form a student-facing booking timeline yet. Add at least one unit before keeping it exposed."
              )}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {selectedResource.units.map((unit) => {
              const isSelected = unit.id === selectedUnitId;

              return (
                <div
                  key={unit.id}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-ember bg-ember/10"
                      : "border-navy/10 bg-sand hover:border-moss"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{unit.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/45">
                        {unit.code}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          isSelected
                            ? "border-ember/30 bg-white text-ember"
                            : "border-moss/20 text-moss hover:bg-moss/10"
                        }`}
                        onClick={() => onSelectUnit(unit.id)}
                      >
                        {isSelected
                          ? localeText(locale, "正在编辑", "Editing")
                          : localeText(locale, "编辑", "Edit")}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-danger/20 px-3 py-1 text-xs text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => onDeleteResourceUnit(unit.id)}
                        disabled={deleteResourceUnitMutation.isPending}
                      >
                        {localeText(locale, "删除", "Delete")}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill tone="brand">{unit.unitType}</StatusPill>
                    <StatusPill tone="neutral">
                      {availabilityModeLabel(unit.availabilityMode, locale)}
                    </StatusPill>
                    <StatusPill tone="success">
                      {localeText(locale, `容量 ${unit.capacity ?? 1}`, `Capacity ${unit.capacity ?? 1}`)}
                    </StatusPill>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <MutationState
          mutation={deleteResourceUnitMutation}
          pending={localeText(locale, "正在删除资源单元。", "Deleting resource unit.")}
          success={localeText(locale, "资源单元已删除。", "Resource unit deleted.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
      </div>
    </>
  );
}

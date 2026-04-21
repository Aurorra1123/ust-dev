import type {
  AdminResourceDetailResponse,
  AdminResourceReservationStatusResponse
} from "@campusbook/shared-types";

import { formatDateTime } from "../../../../../lib/date";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatePanel, StatusPill } from "../../../../user-experience-kit";
import {
  channelStatusLabel,
  channelStatusTone,
  describeReleaseRule,
  releaseFrequencyLabel,
  resourceTypeLabel
} from "../../admin-helpers";
import { AdminInfoCard } from "../../components/admin-info-card";
import { MutationState } from "../../components/mutation-state";
import { ReservationStatusList } from "../../components/reservation-status-list";
import {
  formatResourceMutationError,
  type StatusWindowState
} from "./resources-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

type ResourceStatusQueryState = {
  data: AdminResourceReservationStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export function ResourcesDetailPanel({
  locale,
  resources,
  selectedResource,
  resourceOperationTargets,
  onToggleResourceOperationTarget,
  onToggleResourceStatus,
  onDeleteResource,
  onDeleteResourceUnit,
  updateResourceStatusMutation,
  deleteResourceMutation,
  deleteResourceUnitMutation,
  statusWindow,
  onStatusWindowChange,
  resourceStatusQuery,
  onCancelReservation,
  cancelReservationMutation
}: {
  locale: Locale;
  resources: AdminResourceDetailResponse[];
  selectedResource: AdminResourceDetailResponse | null;
  resourceOperationTargets: string[];
  onToggleResourceOperationTarget: (resourceId: string, nextChecked: boolean) => void;
  onToggleResourceStatus: () => void;
  onDeleteResource: () => void;
  onDeleteResourceUnit: (unitId: string) => void;
  updateResourceStatusMutation: MutationStateLike;
  deleteResourceMutation: MutationStateLike;
  deleteResourceUnitMutation: MutationStateLike;
  statusWindow: StatusWindowState;
  onStatusWindowChange: (field: keyof StatusWindowState, value: string) => void;
  resourceStatusQuery: ResourceStatusQueryState;
  onCancelReservation: (orderId: string) => void;
  cancelReservationMutation: MutationStateLike;
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
              {localeText(locale, "当前资源结构", "Current Resource Structure")}
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
            <StatusPill tone={channelStatusTone(selectedResource.channelStatus.status)}>
              {channelStatusLabel(selectedResource.channelStatus.status, locale)}
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
            label={localeText(locale, "当前位置", "Location")}
            value={selectedResource.location || localeText(locale, "未填写", "Not set")}
          />
          <AdminInfoCard
            label={localeText(locale, "资源单元", "Units")}
            value={localeText(locale, `${selectedResource.units.length} 个`, `${selectedResource.units.length}`)}
          />
          <AdminInfoCard
            label={localeText(locale, "开放策略", "Opening Strategy")}
            value={localeText(
              locale,
              `${selectedResource.releaseRules.length} 条`,
              `${selectedResource.releaseRules.length}`
            )}
          />
          <AdminInfoCard
            label={localeText(locale, "预约关闭规则", "Closures")}
            value={localeText(
              locale,
              `${selectedResource.bookingClosures.length} 条`,
              `${selectedResource.bookingClosures.length}`
            )}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {selectedResource.units.map((unit) => (
            <div key={unit.id} className="rounded-2xl border border-navy/10 bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{unit.name}</p>
                <button
                  type="button"
                  className="rounded-full border border-danger/20 px-3 py-1 text-xs text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => onDeleteResourceUnit(unit.id)}
                  disabled={deleteResourceUnitMutation.isPending}
                >
                  {localeText(locale, "删除", "Delete")}
                </button>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">{unit.code}</p>
              <p className="mt-2 text-sm text-slate">
                {localeText(locale, `类型：${unit.unitType}`, `Type: ${unit.unitType}`)}
              </p>
            </div>
          ))}
        </div>
        <MutationState
          mutation={deleteResourceUnitMutation}
          pending={localeText(locale, "正在删除资源单元。", "Deleting resource unit.")}
          success={localeText(locale, "资源单元已删除。", "Resource unit deleted.")}
          formatError={(error) => formatResourceMutationError(error, locale)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
        <div className="rounded-[24px] border border-navy/10 bg-white px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink">
                {localeText(locale, "预约开放概况", "Booking Availability Overview")}
              </h3>
              <p className="mt-2 text-sm text-slate">
                {selectedResource.channelStatus.status === "scheduled" &&
                selectedResource.channelStatus.nextReleaseAt
                  ? localeText(
                      locale,
                      `当前等待开放，下次开放时间为 ${formatDateTime(selectedResource.channelStatus.nextReleaseAt)}。`,
                      `This resource is not open yet. The next opening time is ${formatDateTime(selectedResource.channelStatus.nextReleaseAt)}.`
                    )
                  : selectedResource.channelStatus.status === "closed"
                    ? localeText(
                        locale,
                        selectedResource.channelStatus.activeClosureReason
                          ? `当前关闭原因：${selectedResource.channelStatus.activeClosureReason}`
                          : "当前存在生效中的预约关闭规则。",
                        selectedResource.channelStatus.activeClosureReason
                          ? `Current closure reason: ${selectedResource.channelStatus.activeClosureReason}`
                          : "An active booking closure is currently applied."
                      )
                    : localeText(
                        locale,
                        "当前资源预约通道已开启。",
                        "The booking channel for this resource is currently open."
                      )}
              </p>
            </div>
            <StatusPill tone={channelStatusTone(selectedResource.channelStatus.status)}>
              {channelStatusLabel(selectedResource.channelStatus.status, locale)}
            </StatusPill>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-ink">
                {localeText(locale, "预约开放策略", "Opening Strategy")}
              </p>
              <div className="mt-3 grid gap-3">
                {selectedResource.releaseRules.length ? (
                  selectedResource.releaseRules.map((rule) => (
                    <div key={rule.id} className="rounded-2xl border border-ink/10 bg-sand px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-ink">
                          {releaseFrequencyLabel(rule.frequency, locale)}
                        </p>
                        <StatusPill tone={rule.isActive ? "success" : "neutral"}>
                          {rule.isActive
                            ? localeText(locale, "启用", "Active")
                            : localeText(locale, "停用", "Inactive")}
                        </StatusPill>
                      </div>
                      <p className="mt-2 text-sm text-slate">{describeReleaseRule(rule, locale)}</p>
                      <p className="mt-2 text-xs text-ink/50">
                        {localeText(locale, "下次开放：", "Next open: ")}
                        {formatDateTime(rule.nextReleaseAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ink/12 px-4 py-4 text-sm text-slate">
                    {localeText(
                      locale,
                      "当前按默认开放策略运行，没有额外的延迟开放设置。",
                      "This resource follows the default open strategy and has no delayed opening configuration."
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink">
                {localeText(locale, "预约关闭规则", "Booking Closures")}
              </p>
              <div className="mt-3 grid gap-3">
                {selectedResource.bookingClosures.length ? (
                  selectedResource.bookingClosures.slice(0, 5).map((closure) => (
                    <div key={closure.id} className="rounded-2xl border border-ink/10 bg-sand px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-ink">
                          {formatDateTime(closure.startsAt)} {" → "}
                          {closure.endsAt
                            ? formatDateTime(closure.endsAt)
                            : localeText(locale, "长期关闭", "Open-ended")}
                        </p>
                        <StatusPill tone={closure.isCurrentlyClosed ? "danger" : "neutral"}>
                          {closure.isCurrentlyClosed
                            ? localeText(locale, "生效中", "Live")
                            : localeText(locale, "已登记", "Recorded")}
                        </StatusPill>
                      </div>
                      <p className="mt-2 text-sm text-slate">
                        {closure.reason ||
                          localeText(locale, "未填写关闭原因。", "No closure reason provided.")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ink/12 px-4 py-4 text-sm text-slate">
                    {localeText(locale, "当前还没有配置关闭规则。", "No booking closures configured yet.")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
          <h3 className="text-lg font-semibold text-ink">
            {localeText(locale, "批量作用资源", "Batch Targets")}
          </h3>
          <p className="mt-2 text-sm text-slate">
            {localeText(
              locale,
              "开放策略和关闭规则都支持一次作用到多个资源。",
              "Opening strategies and booking closures can target multiple resources at once."
            )}
          </p>
          <div className="mt-4 grid gap-2">
            {resources.map((resource) => {
              const checked = resourceOperationTargets.includes(resource.id);

              return (
                <label
                  key={resource.id}
                  className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      onToggleResourceOperationTarget(resource.id, event.target.checked)
                    }
                  />
                  <span>{resource.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">
              {localeText(locale, "资源预约状态", "Reservation Status")}
            </h3>
            <p className="mt-2 text-sm text-slate">
              {localeText(
                locale,
                "按时间窗口查看当前资源的预约、关闭规则和管理员取消入口。",
                "Inspect reservations, closures, and the admin cancellation entry for the selected time window."
              )}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="datetime-local"
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={statusWindow.from}
              onChange={(event) => onStatusWindowChange("from", event.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={statusWindow.to}
              onChange={(event) => onStatusWindowChange("to", event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <AdminInfoCard
            label={localeText(locale, "通道状态", "Channel")}
            value={channelStatusLabel(
              resourceStatusQuery.data?.channelStatus.status ?? selectedResource.channelStatus.status,
              locale
            )}
          />
          <AdminInfoCard
            label={localeText(locale, "学术空间预约", "Academic Reservations")}
            value={String(resourceStatusQuery.data?.academicReservations.length ?? 0)}
          />
          <AdminInfoCard
            label={localeText(locale, "体育设施预约", "Sports Reservations")}
            value={String(resourceStatusQuery.data?.sportsReservations.length ?? 0)}
          />
        </div>

        <div className="mt-5">
          {resourceStatusQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title={localeText(locale, "正在查询预约状态", "Loading reservation status")}
              description={localeText(
                locale,
                "页面正在统计当前时间窗口内的预约和关闭记录。",
                "The page is collecting reservations and closures for the selected time window."
              )}
            />
          ) : resourceStatusQuery.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "预约状态暂时无法加载", "Reservation status is unavailable")}
              description={resourceStatusQuery.error?.message ?? ""}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <ReservationStatusList
                title={localeText(locale, "学术空间预约", "Academic Reservations")}
                entries={resourceStatusQuery.data?.academicReservations ?? []}
                onCancel={onCancelReservation}
                locale={locale}
                isMutating={cancelReservationMutation.isPending}
              />
              <ReservationStatusList
                title={localeText(locale, "体育设施预约", "Sports Reservations")}
                entries={resourceStatusQuery.data?.sportsReservations ?? []}
                onCancel={onCancelReservation}
                locale={locale}
                isMutating={cancelReservationMutation.isPending}
              />
            </div>
          )}
          <MutationState
            mutation={cancelReservationMutation}
            success={localeText(
              locale,
              "预约已由管理员取消。",
              "The reservation has been cancelled by the admin."
            )}
          />
        </div>
      </div>
    </>
  );
}

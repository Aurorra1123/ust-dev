import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ResourceReleaseFrequency, ResourceType } from "@campusbook/shared-types";

import { cancelOrder } from "../../../../lib/api/order-api";
import {
  createResource,
  createResourceBookingClosures,
  createResourceReleaseRules,
  createResourceUnit,
  fetchAdminResourceReservationStatus,
  fetchAdminResources
} from "../../../../lib/api/resource-api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../../../lib/date";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel, StatusPill } from "../../../user-experience-kit";
import {
  channelStatusLabel,
  channelStatusTone,
  describeReleaseRule,
  releaseFrequencyLabel,
  resourceTypeLabel,
  weekDayOptions
} from "../admin-helpers";
import { AdminInfoCard } from "../components/admin-info-card";
import { MutationState } from "../components/mutation-state";
import { ReservationStatusList } from "../components/reservation-status-list";

type ResourceUnitFormState = {
  code: string;
  name: string;
  unitType: string;
  availabilityMode: "continuous" | "discrete_slot";
  capacity: number;
};

type ReleaseRuleFormState = {
  frequency: ResourceReleaseFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
};

type BookingClosureFormState = {
  startsAt: string;
  endsAt: string;
  reason: string;
  indefinite: boolean;
};

export function ResourcesWorkspace({ locale }: { locale: Locale }) {
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const [resourceId, setResourceId] = useState("");
  const [resourceForm, setResourceForm] = useState({
    type: "academic_space" as ResourceType,
    code: "res_admin_demo_new",
    name: "创新协作室",
    description: "由管理后台新增的学术空间资源。",
    location: "A 栋 4 楼",
    status: "active" as const
  });
  const [resourceUnitForm, setResourceUnitForm] = useState<ResourceUnitFormState>({
    code: "unit_admin_demo_new",
    name: "协作席位 A",
    unitType: "room",
    availabilityMode: "continuous",
    capacity: 8
  });
  const [resourceOperationTargets, setResourceOperationTargets] = useState<string[]>([]);
  const [releaseRuleForm, setReleaseRuleForm] = useState<ReleaseRuleFormState>({
    frequency: "daily",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 8,
    minute: 0
  });
  const [bookingClosureForm, setBookingClosureForm] = useState<BookingClosureFormState>(() => {
    const startsAt = startOfNextHour();
    const endsAt = addHours(startsAt, 2);

    return {
      startsAt: toDateTimeLocalValue(startsAt),
      endsAt: toDateTimeLocalValue(endsAt),
      reason: "场地维护",
      indefinite: false
    };
  });
  const [statusWindow, setStatusWindow] = useState(() => {
    const from = startOfNextHour();
    const to = addHours(from, 24);

    return {
      from: toDateTimeLocalValue(from),
      to: toDateTimeLocalValue(to)
    };
  });

  useEffect(() => {
    const firstResource = resourcesQuery.data?.[0];

    if (!resourceId && firstResource) {
      setResourceId(firstResource.id);
    }
  }, [resourceId, resourcesQuery.data]);

  const selectedResource =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setResourceUnitForm((current) => ({
      ...current,
      availabilityMode:
        selectedResource.type === "academic_space" ? "continuous" : "discrete_slot",
      unitType: selectedResource.type === "academic_space" ? "room" : "court"
    }));
  }, [selectedResource]);

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setResourceOperationTargets((current) =>
      current.length > 0 ? current : [selectedResource.id]
    );
  }, [selectedResource]);

  const createResourceMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async (resource) => {
      setResourceId(resource.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const createResourceUnitMutation = useMutation({
    mutationFn: (payload: {
      resourceId: string;
      code: string;
      name: string;
      unitType: string;
      availabilityMode: "continuous" | "discrete_slot";
      capacity: number;
    }) => createResourceUnit(payload.resourceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const createReleaseRuleMutation = useMutation({
    mutationFn: createResourceReleaseRules,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
    }
  });

  const createBookingClosureMutation = useMutation({
    mutationFn: createResourceBookingClosures,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] })
      ]);
    }
  });

  const cancelReservationMutation = useMutation({
    mutationFn: (payload: { orderId: string; reason: string }) =>
      cancelOrder(payload.orderId, payload.reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resource-status"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] })
      ]);
    }
  });

  const resourceStatusQuery = useQuery({
    queryKey: [
      "admin",
      "resource-status",
      selectedResource?.id ?? "none",
      statusWindow.from,
      statusWindow.to
    ],
    queryFn: () =>
      fetchAdminResourceReservationStatus(selectedResource!.id, {
        from: new Date(statusWindow.from).toISOString(),
        to: new Date(statusWindow.to).toISOString()
      }),
    enabled: Boolean(selectedResource)
  });

  return (
    <PageSection
      title={localeText(locale, "资源工作区", "Resource Workspace")}
      description={localeText(
        locale,
        "这里集中处理资源列表、周期性放号、预约通道关闭和预约状态查看。左侧先选资源，中间看当前状态，右侧执行新增和配置操作。",
        "This workspace manages the resource list, recurring release schedules, booking closures, and reservation status. Select a resource on the left, review its current status in the center, and configure updates on the right."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
        <div className="grid gap-4">
          {resourcesQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title={localeText(locale, "正在载入资源工作区", "Loading resource workspace")}
              description={localeText(
                locale,
                "页面正在整理当前可维护的资源、放号规则和预约状态。",
                "The page is loading current resources, release schedules, and reservation status."
              )}
            />
          ) : resourcesQuery.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "资源工作区暂时无法加载", "Resource workspace is unavailable")}
              description={(resourcesQuery.error as Error).message}
            />
          ) : (
            resourcesQuery.data?.map((resource) => (
              <button
                key={resource.id}
                type="button"
                className={`rounded-[26px] border px-5 py-5 text-left transition ${
                  resource.id === selectedResource?.id
                    ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                    : "border-ink/10 bg-white hover:border-moss"
                }`}
                onClick={() => setResourceId(resource.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-moss">
                      {resource.type === "academic_space" ? "Academic" : "Sports"}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">
                      {resource.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={resource.status === "active" ? "success" : "danger"}>
                      {resource.status === "active"
                        ? localeText(locale, "启用中", "Active")
                        : localeText(locale, "已停用", "Inactive")}
                    </StatusPill>
                    <StatusPill tone={channelStatusTone(resource.channelStatus.status)}>
                      {channelStatusLabel(resource.channelStatus.status, locale)}
                    </StatusPill>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink/70">
                  {(resource.location || localeText(locale, "未填写位置", "No location"))} ·{" "}
                  {localeText(
                    locale,
                    `${resource.units.length} 个单元`,
                    `${resource.units.length} units`
                  )}
                </p>
                <p className="mt-2 text-xs text-ink/55">
                  {resource.channelStatus.status === "scheduled" &&
                  resource.channelStatus.nextReleaseAt
                    ? localeText(
                        locale,
                        `下次放号 ${formatDateTime(resource.channelStatus.nextReleaseAt)}`,
                        `Next release ${formatDateTime(resource.channelStatus.nextReleaseAt)}`
                      )
                    : resource.channelStatus.status === "closed"
                      ? localeText(
                          locale,
                          resource.channelStatus.activeClosureReason
                            ? `关闭原因：${resource.channelStatus.activeClosureReason}`
                            : "当前存在预约关闭规则",
                          resource.channelStatus.activeClosureReason
                            ? `Closed: ${resource.channelStatus.activeClosureReason}`
                            : "Booking channel is currently closed"
                        )
                      : localeText(locale, "当前可接受预约", "Booking channel is open")}
                </p>
              </button>
            ))
          )}

          {selectedResource ? (
            <>
              <div className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-sand via-white to-mist px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-moss">
                      {localeText(locale, "当前资源结构", "Current Resource Structure")}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-ink">
                      {selectedResource.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="brand">{resourceTypeLabel(selectedResource.type)}</StatusPill>
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
                    value={localeText(
                      locale,
                      `${selectedResource.units.length} 个`,
                      `${selectedResource.units.length}`
                    )}
                  />
                  <AdminInfoCard
                    label={localeText(locale, "放号规则", "Release Rules")}
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
                    <div
                      key={unit.id}
                      className="rounded-2xl border border-navy/10 bg-white px-4 py-4"
                    >
                      <p className="font-medium text-ink">{unit.name}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">
                        {unit.code}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
                <div className="rounded-[24px] border border-navy/10 bg-white px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">
                        {localeText(locale, "通道与规则概况", "Channel and Scheduling")}
                      </h3>
                      <p className="mt-2 text-sm text-slate">
                        {selectedResource.channelStatus.status === "scheduled" &&
                        selectedResource.channelStatus.nextReleaseAt
                          ? localeText(
                              locale,
                              `当前等待放号，最近一次放号时间为 ${formatDateTime(selectedResource.channelStatus.nextReleaseAt)}。`,
                              `The resource is waiting for release. The next release time is ${formatDateTime(selectedResource.channelStatus.nextReleaseAt)}.`
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
                        {localeText(locale, "放号规则", "Release Rules")}
                      </p>
                      <div className="mt-3 grid gap-3">
                        {selectedResource.releaseRules.length ? (
                          selectedResource.releaseRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                            >
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
                              <p className="mt-2 text-sm text-slate">
                                {describeReleaseRule(rule, locale)}
                              </p>
                              <p className="mt-2 text-xs text-ink/50">
                                {localeText(locale, "下次放号：", "Next release: ")}
                                {formatDateTime(rule.nextReleaseAt)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-ink/12 px-4 py-4 text-sm text-slate">
                            {localeText(locale, "当前还没有配置放号规则。", "No release rules configured yet.")}
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
                            <div
                              key={closure.id}
                              className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                            >
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
                    {localeText(locale, "作用资源", "Target Resources")}
                  </h3>
                  <p className="mt-2 text-sm text-slate">
                    {localeText(
                      locale,
                      "放号规则和关闭规则都支持一次作用到多个资源。",
                      "Release rules and booking closures can target multiple resources at once."
                    )}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {resourcesQuery.data?.map((resource) => {
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
                              setResourceOperationTargets((current) =>
                                event.target.checked
                                  ? Array.from(new Set([...current, resource.id]))
                                  : current.filter((id) => id !== resource.id)
                              )
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
                      onChange={(event) =>
                        setStatusWindow((current) => ({
                          ...current,
                          from: event.target.value
                        }))
                      }
                    />
                    <input
                      type="datetime-local"
                      className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                      value={statusWindow.to}
                      onChange={(event) =>
                        setStatusWindow((current) => ({
                          ...current,
                          to: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <AdminInfoCard
                    label={localeText(locale, "通道状态", "Channel")}
                    value={channelStatusLabel(
                      resourceStatusQuery.data?.channelStatus.status ??
                        selectedResource.channelStatus.status,
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
                      description={(resourceStatusQuery.error as Error).message}
                    />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ReservationStatusList
                        title={localeText(locale, "学术空间预约", "Academic Reservations")}
                        entries={resourceStatusQuery.data?.academicReservations ?? []}
                        onCancel={(orderId) =>
                          cancelReservationMutation.mutate({
                            orderId,
                            reason: localeText(
                              locale,
                              "管理员从资源工作台取消预约",
                              "Cancelled by admin from resource workspace"
                            )
                          })
                        }
                        locale={locale}
                        isMutating={cancelReservationMutation.isPending}
                      />
                      <ReservationStatusList
                        title={localeText(locale, "体育设施预约", "Sports Reservations")}
                        entries={resourceStatusQuery.data?.sportsReservations ?? []}
                        onCancel={(orderId) =>
                          cancelReservationMutation.mutate({
                            orderId,
                            reason: localeText(
                              locale,
                              "管理员从资源工作台取消预约",
                              "Cancelled by admin from resource workspace"
                            )
                          })
                        }
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
          ) : null}
        </div>

        <div className="grid gap-4">
          <form
            className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              createResourceMutation.mutate(resourceForm);
            }}
          >
            <h3 className="text-lg font-semibold text-ink">新增资源</h3>
            <div className="mt-4 grid gap-3">
              <select
                className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceForm.type}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    type: event.target.value as ResourceType
                  }))
                }
              >
                <option value="academic_space">学术空间</option>
                <option value="sports_facility">体育设施</option>
              </select>
              <input
                className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceForm.code}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    code: event.target.value
                  }))
                }
                placeholder="资源编码"
              />
              <input
                className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceForm.name}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                placeholder="资源名称"
              />
              <input
                className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceForm.location}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    location: event.target.value
                  }))
                }
                placeholder="位置"
              />
              <textarea
                className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceForm.description}
                onChange={(event) =>
                  setResourceForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="描述"
              />
            </div>
            <MutationState mutation={createResourceMutation} success="资源已创建。" />
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={createResourceMutation.isPending}
            >
              {createResourceMutation.isPending ? "创建中" : "创建资源"}
            </button>
          </form>

          <form
            className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedResource) {
                return;
              }

              createResourceUnitMutation.mutate({
                resourceId: selectedResource.id,
                ...resourceUnitForm
              });
            }}
          >
            <h3 className="text-lg font-semibold text-ink">新增资源单元</h3>
            <p className="mt-2 text-sm text-ink/70">
              当前资源：{selectedResource?.name || "请先选择左侧资源"}
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceUnitForm.code}
                onChange={(event) =>
                  setResourceUnitForm((current) => ({
                    ...current,
                    code: event.target.value
                  }))
                }
                placeholder="单元编码"
              />
              <input
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceUnitForm.name}
                onChange={(event) =>
                  setResourceUnitForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                placeholder="单元名称"
              />
              <input
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={resourceUnitForm.unitType}
                onChange={(event) =>
                  setResourceUnitForm((current) => ({
                    ...current,
                    unitType: event.target.value
                  }))
                }
                placeholder="单元类型"
              />
            </div>
            <MutationState mutation={createResourceUnitMutation} success="资源单元已创建。" />
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
              disabled={!selectedResource || createResourceUnitMutation.isPending}
            >
              {createResourceUnitMutation.isPending ? "创建中" : "创建资源单元"}
            </button>
          </form>

          <form
            className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!resourceOperationTargets.length) {
                return;
              }

              createReleaseRuleMutation.mutate({
                resourceIds: resourceOperationTargets,
                frequency: releaseRuleForm.frequency,
                dayOfWeek:
                  releaseRuleForm.frequency === "weekly"
                    ? releaseRuleForm.dayOfWeek
                    : undefined,
                dayOfMonth:
                  releaseRuleForm.frequency === "monthly"
                    ? releaseRuleForm.dayOfMonth
                    : undefined,
                hour: releaseRuleForm.hour,
                minute: releaseRuleForm.minute
              });
            }}
          >
            <h3 className="text-lg font-semibold text-ink">
              {localeText(locale, "新增放号规则", "Create release rule")}
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              {localeText(
                locale,
                "可为一个或多个资源配置每天、每周、每月的统一放号时间。",
                "Configure daily, weekly, or monthly release times for one or multiple resources."
              )}
            </p>
            <div className="mt-4 grid gap-3">
              <select
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={releaseRuleForm.frequency}
                onChange={(event) =>
                  setReleaseRuleForm((current) => ({
                    ...current,
                    frequency: event.target.value as ResourceReleaseFrequency
                  }))
                }
              >
                <option value="daily">{localeText(locale, "每天", "Daily")}</option>
                <option value="weekly">{localeText(locale, "每周", "Weekly")}</option>
                <option value="monthly">{localeText(locale, "每月", "Monthly")}</option>
              </select>

              {releaseRuleForm.frequency === "weekly" ? (
                <select
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={releaseRuleForm.dayOfWeek}
                  onChange={(event) =>
                    setReleaseRuleForm((current) => ({
                      ...current,
                      dayOfWeek: Number(event.target.value)
                    }))
                  }
                >
                  {weekDayOptions(locale).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {releaseRuleForm.frequency === "monthly" ? (
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={releaseRuleForm.dayOfMonth}
                  onChange={(event) =>
                    setReleaseRuleForm((current) => ({
                      ...current,
                      dayOfMonth: Number(event.target.value)
                    }))
                  }
                  placeholder={localeText(locale, "每月日期", "Day of month")}
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={releaseRuleForm.hour}
                  onChange={(event) =>
                    setReleaseRuleForm((current) => ({
                      ...current,
                      hour: Number(event.target.value)
                    }))
                  }
                  placeholder="Hour"
                />
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={releaseRuleForm.minute}
                  onChange={(event) =>
                    setReleaseRuleForm((current) => ({
                      ...current,
                      minute: Number(event.target.value)
                    }))
                  }
                  placeholder="Minute"
                />
              </div>
            </div>
            <MutationState
              mutation={createReleaseRuleMutation}
              success={localeText(locale, "放号规则已保存。", "Release rules saved.")}
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/50"
              disabled={!resourceOperationTargets.length || createReleaseRuleMutation.isPending}
            >
              {createReleaseRuleMutation.isPending
                ? localeText(locale, "保存中", "Saving")
                : localeText(locale, "保存放号规则", "Save release rule")}
            </button>
          </form>

          <form
            className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!resourceOperationTargets.length) {
                return;
              }

              createBookingClosureMutation.mutate({
                resourceIds: resourceOperationTargets,
                startsAt: new Date(bookingClosureForm.startsAt).toISOString(),
                endsAt: bookingClosureForm.indefinite
                  ? null
                  : new Date(bookingClosureForm.endsAt).toISOString(),
                reason: bookingClosureForm.reason
              });
            }}
          >
            <h3 className="text-lg font-semibold text-ink">
              {localeText(locale, "新增预约关闭规则", "Create booking closure")}
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              {localeText(
                locale,
                "支持按时间段关闭预约，也支持从当前时间开始长期关闭。",
                "Close booking for a time range, or close the channel indefinitely from now."
              )}
            </p>
            <div className="mt-4 grid gap-3">
              <input
                type="datetime-local"
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={bookingClosureForm.startsAt}
                onChange={(event) =>
                  setBookingClosureForm((current) => ({
                    ...current,
                    startsAt: event.target.value
                  }))
                }
              />
              {!bookingClosureForm.indefinite ? (
                <input
                  type="datetime-local"
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={bookingClosureForm.endsAt}
                  onChange={(event) =>
                    setBookingClosureForm((current) => ({
                      ...current,
                      endsAt: event.target.value
                    }))
                  }
                />
              ) : null}
              <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={bookingClosureForm.indefinite}
                  onChange={(event) =>
                    setBookingClosureForm((current) => ({
                      ...current,
                      indefinite: event.target.checked
                    }))
                  }
                />
                <span>{localeText(locale, "从当前时间开始长期关闭", "Close indefinitely from start time")}</span>
              </label>
              <textarea
                className="min-h-[88px] rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={bookingClosureForm.reason}
                onChange={(event) =>
                  setBookingClosureForm((current) => ({
                    ...current,
                    reason: event.target.value
                  }))
                }
                placeholder={localeText(locale, "关闭原因", "Closure reason")}
              />
            </div>
            <MutationState
              mutation={createBookingClosureMutation}
              success={localeText(locale, "预约关闭规则已保存。", "Booking closure saved.")}
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-danger px-5 py-3 text-sm font-medium text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:bg-danger/50"
              disabled={!resourceOperationTargets.length || createBookingClosureMutation.isPending}
            >
              {createBookingClosureMutation.isPending
                ? localeText(locale, "保存中", "Saving")
                : localeText(locale, "保存关闭规则", "Save booking closure")}
            </button>
          </form>
        </div>
      </div>
    </PageSection>
  );
}

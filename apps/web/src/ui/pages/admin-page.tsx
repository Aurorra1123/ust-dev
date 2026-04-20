import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  ResourceChannelStatus,
  ResourceReleaseFrequency,
  ResourceType
} from "@campusbook/shared-types";

import {
  ApiError,
  cancelOrder,
  createResourceBookingClosures,
  createResourceReleaseRules,
  createActivity,
  createActivityTicket,
  createResource,
  createResourceUnit,
  fetchAdminActivities,
  fetchAdminResourceReservationStatus,
  fetchAdminResources,
  fetchAdminRules,
  updateActivity
} from "../../lib/api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  HighlightPanel,
  StatePanel,
  StatusPill,
  StepList
} from "../user-experience-kit";

type ResourceUnitFormState = {
  code: string;
  name: string;
  unitType: string;
  availabilityMode: "continuous" | "discrete_slot";
  capacity: number;
};

type ActivityFormState = {
  title: string;
  description: string;
  location: string;
  totalQuota: number;
  saleStartTime: string;
  saleEndTime: string;
  eventStartTime: string;
  eventEndTime: string;
  status: "draft" | "published";
  ticketName: string;
  ticketStock: number;
  priceCents: number;
};

type WorkspaceTab = "overview" | "resources" | "activities" | "rules";

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

export function AdminPage() {
  const locale = useLocaleStore((state) => state.locale);
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const activitiesQuery = useQuery({
    queryKey: ["admin", "activities"],
    queryFn: fetchAdminActivities
  });
  const rulesQuery = useQuery({
    queryKey: ["admin", "rules"],
    queryFn: fetchAdminRules
  });

  const [resourceId, setResourceId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("overview");
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
  const [activityForm, setActivityForm] = useState<ActivityFormState>(() => {
    const saleStart = startOfNextHour();
    const saleEnd = addHours(saleStart, 24);
    const eventStart = addHours(saleStart, 26);
    const eventEnd = addHours(eventStart, 2);

    return {
      title: "CampusBook 校园服务说明会",
      description: "由管理后台创建的活动示例，用于验证票种和状态流转。",
      location: "学生活动中心",
      totalQuota: 30,
      saleStartTime: toDateTimeLocalValue(saleStart),
      saleEndTime: toDateTimeLocalValue(saleEnd),
      eventStartTime: toDateTimeLocalValue(eventStart),
      eventEndTime: toDateTimeLocalValue(eventEnd),
      status: "published",
      ticketName: "普通票",
      ticketStock: 20,
      priceCents: 0
    };
  });
  const [ticketForm, setTicketForm] = useState({
    name: "候补票",
    stock: 10,
    priceCents: 0
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

  useEffect(() => {
    const firstActivity = activitiesQuery.data?.[0];

    if (!activityId && firstActivity) {
      setActivityId(firstActivity.id);
    }
  }, [activityId, activitiesQuery.data]);

  const selectedResource =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;
  const selectedActivity =
    activitiesQuery.data?.find((activity) => activity.id === activityId) ??
    activitiesQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setResourceUnitForm((current) => ({
      ...current,
      availabilityMode:
        selectedResource.type === "academic_space"
          ? "continuous"
          : "discrete_slot",
      unitType:
        selectedResource.type === "academic_space" ? "room" : "court"
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

  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: async (activity) => {
      setActivityId(activity.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload: {
      activityId: string;
      name: string;
      stock: number;
      priceCents: number;
    }) => createActivityTicket(payload.activityId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const publishMutation = useMutation({
    mutationFn: (status: "published" | "closed") =>
      updateActivity(activityId, {
        status
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
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

  const resourceStats = useMemo(
    () => ({
      resourceCount: resourcesQuery.data?.length ?? 0,
      unitCount:
        resourcesQuery.data?.reduce((total, resource) => total + resource.units.length, 0) ?? 0
    }),
    [resourcesQuery.data]
  );
  const activityStats = useMemo(
    () => ({
      total: activitiesQuery.data?.length ?? 0,
      published:
        activitiesQuery.data?.filter((activity) => activity.status === "published").length ?? 0,
      ticketCount:
        activitiesQuery.data?.reduce((total, activity) => total + activity.tickets.length, 0) ??
        0
    }),
    [activitiesQuery.data]
  );
  const ruleStats = useMemo(
    () => ({
      total: rulesQuery.data?.length ?? 0,
      active: rulesQuery.data?.filter((rule) => rule.status === "active").length ?? 0,
      bindings:
        rulesQuery.data?.reduce((total, rule) => total + rule.resourceIds.length, 0) ?? 0
    }),
    [rulesQuery.data]
  );

  return (
    <>
      <PageHero
        eyebrow="Teacher Workspace"
        title={localeText(locale, "教师工作台", "Teacher Workspace")}
        description={localeText(
          locale,
          "登录后直接进入工作台，围绕资源、活动和规则维护展开日常操作。这里不再混入学生端入口，而是聚焦今天需要处理的服务更新。",
          "After signing in, teachers land directly in the workspace for resources, activities, and rule operations. The page focuses on today’s updates instead of student-facing entries."
        )}
        aside={
          <>
            <p className="font-medium text-ink">{localeText(locale, "当前工作区", "Current Workspace")}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">
              {workspaceTabLabel(workspaceTab, locale)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill tone="brand">
                {localeText(locale, `资源 ${resourceStats.resourceCount}`, `Resources ${resourceStats.resourceCount}`)}
              </StatusPill>
              <StatusPill tone="success">
                {localeText(locale, `活动 ${activityStats.total}`, `Activities ${activityStats.total}`)}
              </StatusPill>
              <StatusPill>{localeText(locale, `规则 ${ruleStats.total}`, `Rules ${ruleStats.total}`)}</StatusPill>
            </div>
            <p className="mt-4 text-sm text-slate">
              {localeText(locale, "当前选中资源：", "Selected resource: ")}
              {selectedResource?.name || localeText(locale, "未选择", "None")}
              {localeText(locale, "。", ".")}
            </p>
            <p className="mt-1 text-sm text-slate">
              {localeText(locale, "当前选中活动：", "Selected activity: ")}
              {selectedActivity?.title || localeText(locale, "未选择", "None")}
              {localeText(locale, "。", ".")}
            </p>
          </>
        }
      />

      <PageSection
        title={localeText(locale, "工作区导航", "Workspace Navigation")}
        description={localeText(
          locale,
          "后台按任务切换工作区，而不是让管理员在一张超长页面里找表单。先选工作区，再进入对应的资源、活动或规则维护视图。",
          "Switch workspaces by task instead of searching for forms on one long page. Select a workspace first, then enter the related view for resources, activities, or rules."
        )}
        action={
          <div className="flex flex-wrap gap-2">
            {([
              ["overview", localeText(locale, "总览", "Overview")],
              ["resources", localeText(locale, "资源", "Resources")],
              ["activities", localeText(locale, "活动", "Activities")],
              ["rules", localeText(locale, "规则", "Rules")]
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  workspaceTab === value
                    ? "border-ember bg-ember text-white"
                    : "border-navy/10 bg-sand text-ink hover:border-moss"
                }`}
                onClick={() => setWorkspaceTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr),420px]">
          <HighlightPanel
            eyebrow="Admin Workspace"
            title={localeText(
              locale,
              "围绕实际维护任务组织后台，而不是围绕接口字段组织页面",
              "Organize the admin side around real operations instead of raw interface fields"
            )}
            description={localeText(
              locale,
              "资源维护会影响预约入口，活动维护会影响抢票体验，规则维护会影响资格和限制。工作台化的目标是让管理员更快定位当前任务、更少在页面间迷路。",
              "Resource updates affect booking entry points, activity updates affect ticket experiences, and rule updates affect eligibility. The workspace helps teachers locate tasks faster with less page wandering."
            )}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <WorkspaceBadge label={localeText(locale, "资源", "Resources")} value={localeText(locale, `${resourceStats.resourceCount} 项`, `${resourceStats.resourceCount} items`)} />
              <WorkspaceBadge label={localeText(locale, "活动", "Activities")} value={localeText(locale, `${activityStats.published} 场已发布`, `${activityStats.published} published`)} />
              <WorkspaceBadge label={localeText(locale, "规则", "Rules")} value={localeText(locale, `${ruleStats.active} 条启用`, `${ruleStats.active} active`)} />
            </div>
          </HighlightPanel>

          <StepList
            items={[
              {
                title: localeText(locale, "先判断今天维护什么", "Identify today’s operation focus"),
                description: localeText(locale, "先在总览、资源、活动和规则之间切换到当前工作区。", "Switch to the workspace you need first: overview, resources, activities, or rules.")
              },
              {
                title: localeText(locale, "再查看选中对象详情", "Review the selected object"),
                description: localeText(locale, "先看当前资源、活动或规则的现状，再决定是新增、补充还是调整状态。", "Check the current resource, activity, or rule before deciding whether to add, extend, or change state.")
              },
              {
                title: localeText(locale, "最后再执行写操作", "Perform updates in the same workspace"),
                description: localeText(locale, "创建资源、补单元、加票种或切状态，都应在同一工作区内完成。", "Create resources, add units, create tickets, or change states in the same workspace.")
              }
            ]}
          />
        </div>
      </PageSection>

      {workspaceTab === "overview" ? (
        <PageSection
          title={localeText(locale, "今日维护概览", "Today’s Operations Overview")}
          description={localeText(
            locale,
            "教师工作台首页优先展示今天最需要关注的维护范围、当前选中对象和快捷入口，不再把所有表单直接铺在第一屏。",
            "The teacher homepage prioritizes today’s maintenance focus, currently selected objects, and quick entries instead of placing every form on the first screen."
          )}
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),360px]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="资源总数"
                value={String(resourceStats.resourceCount)}
                detail="覆盖学术空间与体育设施"
              />
              <AdminStatCard
                label="资源单元"
                value={String(resourceStats.unitCount)}
                detail="用于预约与组合资源校验"
              />
              <AdminStatCard
                label="活动数量"
                value={String(activityStats.total)}
                detail="统一维护活动、票种和状态"
              />
              <AdminStatCard
                label="规则数量"
                value={String(ruleStats.total)}
                detail="绑定资源并进入预约主流程"
              />
            </div>

            <div className="grid gap-4">
              <QuickWorkspaceCard
                title="资源工作区"
                description="适合补资源、补单元和核对当前资源结构。"
                action="进入资源维护"
                onClick={() => setWorkspaceTab("resources")}
              />
              <QuickWorkspaceCard
                title="活动工作区"
                description="适合创建活动、补票种和切换活动发布状态。"
                action="进入活动维护"
                onClick={() => setWorkspaceTab("activities")}
              />
              <QuickWorkspaceCard
                title="规则工作区"
                description="适合检查当前规则数量、启用状态和资源绑定规模。"
                action="进入规则查看"
                onClick={() => setWorkspaceTab("rules")}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <OverviewPanel
              title="当前选中资源"
              eyebrow="Selected Resource"
              empty="还没有选中资源。"
            >
              {selectedResource ? (
                <>
                  <p className="text-lg font-semibold text-ink">{selectedResource.name}</p>
                  <p className="mt-2 text-sm text-slate">
                    {resourceTypeLabel(selectedResource.type)} · {selectedResource.units.length} 个单元
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    {selectedResource.location || "未填写位置"}
                  </p>
                </>
              ) : null}
            </OverviewPanel>

            <OverviewPanel
              title="当前选中活动"
              eyebrow="Selected Activity"
              empty="还没有选中活动。"
            >
              {selectedActivity ? (
                <>
                  <p className="text-lg font-semibold text-ink">{selectedActivity.title}</p>
                  <p className="mt-2 text-sm text-slate">
                    {activityStatusLabel(selectedActivity.status)} · {selectedActivity.tickets.length} 个票种
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    {formatDateTime(selectedActivity.saleStartTime)} 开售
                  </p>
                </>
              ) : null}
            </OverviewPanel>

            <OverviewPanel
              title="规则概况"
              eyebrow="Rule Snapshot"
              empty="当前还没有规则快照。"
            >
              {rulesQuery.data?.length ? (
                <>
                  <p className="text-lg font-semibold text-ink">{ruleStats.active} 条启用中</p>
                  <p className="mt-2 text-sm text-slate">
                    总绑定资源数：{ruleStats.bindings}
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    最常见类型：{rulesQuery.data[0] ? ruleTypeLabel(rulesQuery.data[0].ruleType) : "未知"}
                  </p>
                </>
              ) : null}
            </OverviewPanel>
          </div>

          <div className="mt-6">
            <HighlightPanel
              eyebrow="Today Update"
              title="今日功能更新与维护入口"
              description="当前工作台已经可以直接进入资源维护、活动维护和规则查看。后续如需补通知发布，也应作为工作台中的单独操作入口，而不是回到学生首页处理。"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <WorkspaceBadge label="资源维护" value={`${resourceStats.resourceCount} 项`} />
                <WorkspaceBadge label="活动维护" value={`${activityStats.total} 场`} />
                <WorkspaceBadge label="规则查看" value={`${ruleStats.total} 条`} />
              </div>
            </HighlightPanel>
          </div>
        </PageSection>
      ) : null}

      {workspaceTab === "resources" ? (
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
                description={(resourcesQuery.error as ApiError).message}
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
                        description={(resourceStatusQuery.error as ApiError).message}
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
                disabled={
                  !resourceOperationTargets.length || createReleaseRuleMutation.isPending
                }
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
                  <span>
                    {localeText(locale, "从当前时间开始长期关闭", "Close indefinitely from start time")}
                  </span>
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
                disabled={
                  !resourceOperationTargets.length || createBookingClosureMutation.isPending
                }
              >
                {createBookingClosureMutation.isPending
                  ? localeText(locale, "保存中", "Saving")
                  : localeText(locale, "保存关闭规则", "Save booking closure")}
              </button>
            </form>
          </div>
        </div>
      </PageSection>
      ) : null}

      {workspaceTab === "activities" ? (
      <PageSection
        title="活动工作区"
        description="这里负责活动、票种和活动状态维护。左侧先选活动，中间看当前详情，右侧做创建或加票操作。"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),360px]">
          <div className="grid gap-4">
            {activitiesQuery.isLoading ? (
              <StatePanel
                tone="loading"
                title="正在载入活动工作区"
                description="页面正在整理当前活动、票种与状态信息。"
              />
            ) : activitiesQuery.isError ? (
              <StatePanel
                tone="danger"
                title="活动工作区暂时无法加载"
                description={(activitiesQuery.error as ApiError).message}
              />
            ) : (
              activitiesQuery.data?.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  className={`rounded-[26px] border px-5 py-5 text-left transition ${
                    activity.id === selectedActivity?.id
                      ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                      : "border-ink/10 bg-white hover:border-moss"
                  }`}
                  onClick={() => setActivityId(activity.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-moss">
                        {activity.status}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-ink">
                        {activity.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/75">
                      {activity.tickets.length} 个票种
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink/70">
                    {formatDateTime(activity.saleStartTime)} -{" "}
                    {formatDateTime(activity.saleEndTime)}
                  </p>
                </button>
              ))
            )}

            {selectedActivity ? (
              <div className="overflow-hidden rounded-[26px] border border-navy/10 bg-white">
                <div className="border-b border-navy/10 bg-gradient-to-r from-navy via-[#0d3f82] to-moss px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                    Selected Activity
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{selectedActivity.title}</h3>
                  <p className="mt-2 text-sm text-white/80">
                    {selectedActivity.location || "活动地点待补充"}
                  </p>
                </div>
                <div className="px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="brand">{activityStatusLabel(selectedActivity.status)}</StatusPill>
                    <StatusPill tone="success">{selectedActivity.tickets.length} 个票种</StatusPill>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <AdminInfoCard
                      label="开售时间"
                      value={formatDateTime(selectedActivity.saleStartTime)}
                    />
                    <AdminInfoCard
                      label="停售时间"
                      value={formatDateTime(selectedActivity.saleEndTime)}
                    />
                    <AdminInfoCard
                      label="票种数量"
                      value={String(selectedActivity.tickets.length)}
                    />
                    <AdminInfoCard
                      label="总额度"
                      value={String(selectedActivity.totalQuota)}
                    />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {selectedActivity.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-navy/10 bg-sand px-4 py-4"
                      >
                        <p className="font-medium text-ink">{ticket.name}</p>
                        <p className="mt-2 text-sm text-slate">
                          库存 {ticket.stock} / 已保留 {ticket.reserved}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            <form
              className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                createActivityMutation.mutate({
                  title: activityForm.title,
                  description: activityForm.description,
                  location: activityForm.location,
                  totalQuota: activityForm.totalQuota,
                  saleStartTime: new Date(activityForm.saleStartTime).toISOString(),
                  saleEndTime: new Date(activityForm.saleEndTime).toISOString(),
                  eventStartTime: new Date(activityForm.eventStartTime).toISOString(),
                  eventEndTime: new Date(activityForm.eventEndTime).toISOString(),
                  status: activityForm.status,
                  tickets: [
                    {
                      name: activityForm.ticketName,
                      stock: activityForm.ticketStock,
                      priceCents: activityForm.priceCents
                    }
                  ]
                });
              }}
            >
              <h3 className="text-lg font-semibold text-ink">新增活动</h3>
              <div className="mt-4 grid gap-3">
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.title}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  placeholder="活动标题"
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.location}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      location: event.target.value
                    }))
                  }
                  placeholder="活动地点"
                />
                <textarea
                  className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.description}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder="活动描述"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="number"
                    min={1}
                    value={activityForm.totalQuota}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        totalQuota: Number(event.target.value)
                      }))
                    }
                    placeholder="总额度"
                  />
                  <select
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    value={activityForm.status}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        status: event.target.value as "draft" | "published"
                      }))
                    }
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已发布</option>
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="datetime-local"
                    value={activityForm.saleStartTime}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        saleStartTime: event.target.value
                      }))
                    }
                  />
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="datetime-local"
                    value={activityForm.saleEndTime}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        saleEndTime: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="datetime-local"
                    value={activityForm.eventStartTime}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        eventStartTime: event.target.value
                      }))
                    }
                  />
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="datetime-local"
                    value={activityForm.eventEndTime}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        eventEndTime: event.target.value
                      }))
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    value={activityForm.ticketName}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        ticketName: event.target.value
                      }))
                    }
                    placeholder="首个票种名称"
                  />
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="number"
                    min={1}
                    value={activityForm.ticketStock}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        ticketStock: Number(event.target.value)
                      }))
                    }
                    placeholder="票数"
                  />
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="number"
                    min={0}
                    value={activityForm.priceCents}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        priceCents: Number(event.target.value)
                      }))
                    }
                    placeholder="价格分"
                  />
                </div>
              </div>
              <MutationState mutation={createActivityMutation} success="活动已创建。" />
              <button
                type="submit"
                className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                disabled={createActivityMutation.isPending}
              >
                {createActivityMutation.isPending ? "创建中" : "创建活动"}
              </button>
            </form>

            <form
              className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedActivity) {
                  return;
                }

                createTicketMutation.mutate({
                  activityId: selectedActivity.id,
                  ...ticketForm
                });
              }}
            >
              <h3 className="text-lg font-semibold text-ink">活动加票与状态切换</h3>
              <p className="mt-2 text-sm text-ink/70">
                当前活动：{selectedActivity?.title || "请先选择左侧活动"}
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={ticketForm.name}
                  onChange={(event) =>
                    setTicketForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="新增票种名称"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="number"
                    min={1}
                    value={ticketForm.stock}
                    onChange={(event) =>
                      setTicketForm((current) => ({
                        ...current,
                        stock: Number(event.target.value)
                      }))
                    }
                    placeholder="库存"
                  />
                  <input
                    className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                    type="number"
                    min={0}
                    value={ticketForm.priceCents}
                    onChange={(event) =>
                      setTicketForm((current) => ({
                        ...current,
                        priceCents: Number(event.target.value)
                      }))
                    }
                    placeholder="价格分"
                  />
                </div>
              </div>
              <MutationState mutation={createTicketMutation} success="票种已追加。" />
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
                  disabled={!selectedActivity || createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? "提交中" : "新增票种"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-ember/25 px-4 py-3 text-sm text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!selectedActivity || publishMutation.isPending}
                  onClick={() => publishMutation.mutate("published")}
                >
                  发布
                </button>
                <button
                  type="button"
                  className="rounded-full border border-ink/15 px-4 py-3 text-sm text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!selectedActivity || publishMutation.isPending}
                  onClick={() => publishMutation.mutate("closed")}
                >
                  关闭
                </button>
              </div>
            </form>
          </div>
        </div>
      </PageSection>
      ) : null}

      {workspaceTab === "rules" ? (
      <PageSection
        title="规则工作区"
        description="规则当前以快照方式呈现，重点帮助管理员快速理解站点正在执行哪些限制，以及它们绑定了多少资源。"
      >
        {rulesQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title="正在载入规则工作区"
            description="页面正在整理当前启用的规则和资源绑定关系。"
          />
        ) : rulesQuery.isError ? (
          <StatePanel
            tone="danger"
            title="规则工作区暂时无法加载"
            description={(rulesQuery.error as ApiError).message}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),340px]">
            <div className="grid gap-3 lg:grid-cols-2">
              {rulesQuery.data?.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-[26px] border border-ink/10 bg-gradient-to-br from-white to-sand px-5 py-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-moss">
                        {ruleTypeLabel(rule.ruleType)}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink">
                        {rule.name}
                      </p>
                    </div>
                    <StatusPill tone={rule.status === "active" ? "success" : "danger"}>
                      {rule.status === "active" ? "启用中" : "已停用"}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm text-slate">
                    绑定资源：{rule.resourceIds.length || 0}
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-2xl bg-white px-4 py-4 text-xs text-ink/60">
                    {JSON.stringify(rule.expression, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-navy via-[#0d3f82] to-moss px-5 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-white/65">
                  Rule Summary
                </p>
                <h3 className="mt-3 text-2xl font-semibold">当前规则概况</h3>
                <div className="mt-5 grid gap-3">
                  <RuleSummaryRow label="规则总数" value={String(ruleStats.total)} />
                  <RuleSummaryRow label="启用中" value={String(ruleStats.active)} />
                  <RuleSummaryRow label="资源绑定数" value={String(ruleStats.bindings)} />
                </div>
              </div>

              <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
                <p className="text-xs uppercase tracking-[0.22em] text-moss">使用说明</p>
                <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                  <p>规则目前会直接影响预约主流程中的信用分、角色和时长限制。</p>
                  <p>这一页先提供快照视图，帮助管理员快速确认站点当前正在执行哪些规则。</p>
                  <p>后续如进入更深的配置阶段，再继续补全更细的规则编辑体验。</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageSection>
      ) : null}
    </>
  );
}

function MutationState({
  mutation,
  success
}: {
  mutation: {
    isError: boolean;
    error: unknown;
    isSuccess: boolean;
  };
  success: string;
}) {
  if (mutation.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
        {(mutation.error as ApiError).message}
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="mt-4 rounded-2xl border border-moss/20 bg-white px-4 py-3 text-sm text-ink/75">
        {success}
      </div>
    );
  }

  return null;
}

function AdminStatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{detail}</p>
    </div>
  );
}

function WorkspaceBadge({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickWorkspaceCard({
  title,
  description,
  action,
  onClick
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-[24px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5 text-left transition hover:-translate-y-1 hover:border-moss"
      onClick={onClick}
    >
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate">{description}</p>
      <p className="mt-5 text-sm font-medium text-ember">{action} →</p>
    </button>
  );
}

function OverviewPanel({
  eyebrow,
  title,
  empty,
  children
}: {
  eyebrow: string;
  title: string;
  empty: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
      <p className="text-xs uppercase tracking-[0.2em] text-moss">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-4 text-sm text-slate">{children ?? empty}</div>
    </div>
  );
}

function AdminInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function ReservationStatusList({
  title,
  entries,
  onCancel,
  locale,
  isMutating
}: {
  title: string;
  entries: Array<{
    orderId: string;
    orderNo: string;
    userEmail: string;
    status: "pending_confirmation" | "confirmed" | "cancelled" | "no_show";
    resourceUnitName: string;
    startTime: string;
    endTime: string;
    participantCount: number;
    checkedInCount: number;
  }>;
  onCancel: (orderId: string) => void;
  locale: "zh-CN" | "en";
  isMutating: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-navy/10 bg-sand px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-ink">{title}</h4>
        <StatusPill>{localeText(locale, `${entries.length} 条`, `${entries.length}`)}</StatusPill>
      </div>
      <div className="mt-4 grid gap-3">
        {entries.length ? (
          entries.map((entry) => (
            <div key={`${entry.orderId}-${entry.startTime}`} className="rounded-2xl bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{entry.resourceUnitName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">
                    {entry.orderNo}
                  </p>
                </div>
                <StatusPill tone={entry.status === "confirmed" ? "success" : entry.status === "no_show" ? "danger" : "neutral"}>
                  {orderStatusLabel(entry.status, locale)}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm text-slate">
                {entry.userEmail} · {formatDateTime(entry.startTime)} {" → "} {formatDateTime(entry.endTime)}
              </p>
              <p className="mt-2 text-sm text-slate">
                {localeText(
                  locale,
                  `同行人数 ${entry.participantCount}，已签到 ${entry.checkedInCount}`,
                  `${entry.participantCount} participants, ${entry.checkedInCount} checked in`
                )}
              </p>
              {entry.status === "confirmed" ? (
                <button
                  type="button"
                  className="mt-4 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:bg-danger/50"
                  onClick={() => onCancel(entry.orderId)}
                  disabled={isMutating}
                >
                  {localeText(locale, "取消预约", "Cancel reservation")}
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/12 px-4 py-4 text-sm text-slate">
            {localeText(locale, "当前时间窗口内没有预约记录。", "No reservation records in the selected time window.")}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function workspaceTabLabel(tab: WorkspaceTab, locale: "zh-CN" | "en") {
  switch (tab) {
    case "overview":
      return localeText(locale, "运营总览", "Operations Overview");
    case "resources":
      return localeText(locale, "资源工作区", "Resource Workspace");
    case "activities":
      return localeText(locale, "活动工作区", "Activity Workspace");
    case "rules":
      return localeText(locale, "规则工作区", "Rule Workspace");
  }
}

function weekDayOptions(locale: "zh-CN" | "en") {
  return [
    { value: 1, label: localeText(locale, "每周一", "Monday") },
    { value: 2, label: localeText(locale, "每周二", "Tuesday") },
    { value: 3, label: localeText(locale, "每周三", "Wednesday") },
    { value: 4, label: localeText(locale, "每周四", "Thursday") },
    { value: 5, label: localeText(locale, "每周五", "Friday") },
    { value: 6, label: localeText(locale, "每周六", "Saturday") },
    { value: 0, label: localeText(locale, "每周日", "Sunday") }
  ];
}

function releaseFrequencyLabel(
  frequency: ResourceReleaseFrequency,
  locale: "zh-CN" | "en"
) {
  switch (frequency) {
    case "daily":
      return localeText(locale, "每日放号", "Daily release");
    case "weekly":
      return localeText(locale, "每周放号", "Weekly release");
    case "monthly":
      return localeText(locale, "每月放号", "Monthly release");
  }
}

function describeReleaseRule(
  rule: {
    frequency: ResourceReleaseFrequency;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    hour: number;
    minute: number;
  },
  locale: "zh-CN" | "en"
) {
  const time = `${String(rule.hour).padStart(2, "0")}:${String(rule.minute).padStart(2, "0")}`;

  switch (rule.frequency) {
    case "daily":
      return localeText(locale, `每天 ${time} 放号`, `Release daily at ${time}`);
    case "weekly":
      return localeText(
        locale,
        `${weekDayOptions(locale).find((item) => item.value === rule.dayOfWeek)?.label ?? "每周"} ${time} 放号`,
        `Release on ${weekDayOptions(locale).find((item) => item.value === rule.dayOfWeek)?.label ?? "weekly"} at ${time}`
      );
    case "monthly":
      return localeText(
        locale,
        `每月 ${rule.dayOfMonth ?? 1} 日 ${time} 放号`,
        `Release on day ${rule.dayOfMonth ?? 1} at ${time}`
      );
  }
}

function channelStatusTone(status: ResourceChannelStatus) {
  switch (status) {
    case "open":
      return "success" as const;
    case "closed":
      return "danger" as const;
    case "scheduled":
      return "brand" as const;
  }
}

function channelStatusLabel(
  status: ResourceChannelStatus,
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "open":
      return localeText(locale, "可预约", "Open");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
    case "scheduled":
      return localeText(locale, "待放号", "Scheduled");
  }
}

function orderStatusLabel(
  status: "pending_confirmation" | "confirmed" | "cancelled" | "no_show",
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "no_show":
      return localeText(locale, "已爽约", "No-show");
  }
}

function resourceTypeLabel(type: ResourceType) {
  return type === "academic_space" ? "学术空间" : "体育设施";
}

function activityStatusLabel(status: "draft" | "published" | "closed" | "cancelled") {
  switch (status) {
    case "draft":
      return "草稿";
    case "published":
      return "已发布";
    case "closed":
      return "已关闭";
    case "cancelled":
      return "已取消";
  }
}

function ruleTypeLabel(ruleType: "min_credit_score" | "max_duration_minutes" | "allowed_user_roles") {
  switch (ruleType) {
    case "min_credit_score":
      return "最低信用分";
    case "max_duration_minutes":
      return "最长预约时长";
    case "allowed_user_roles":
      return "允许用户角色";
  }
}

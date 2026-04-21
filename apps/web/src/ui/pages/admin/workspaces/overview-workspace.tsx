import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { fetchAdminActivities } from "../../../../lib/api/activity-api";
import { fetchAdminNotifications } from "../../../../lib/api/notification-api";
import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { fetchAdminRules } from "../../../../lib/api/rule-api";
import { fetchAdminServiceRequests } from "../../../../lib/api/service-request-api";
import { ApiError } from "../../../../lib/http/errors";
import { formatDateTime } from "../../../../lib/date";
import { localeText } from "../../../../lib/locale";
import type { Locale } from "../../../../store/locale-store";
import { serviceRequestStatusLabel } from "../../../helpers/service-request-status";
import { PageSection } from "../../../page-section";
import {
  HighlightPanel,
  StatePanel,
  StepList
} from "../../../user-experience-kit";
import {
  activityStatusLabel,
  notificationStatusLabel,
  resourceTypeLabel,
  ruleTypeLabel,
  type WorkspaceTab
} from "../admin-helpers";
import { AdminStatCard } from "../components/admin-stat-card";
import { QuickWorkspaceCard } from "../components/quick-workspace-card";
import { WorkspaceBadge } from "../components/workspace-badge";

export function OverviewWorkspace({
  locale,
  onSelectWorkspace
}: {
  locale: Locale;
  onSelectWorkspace: (tab: WorkspaceTab) => void;
}) {
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
  const notificationsQuery = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: fetchAdminNotifications
  });
  const serviceRequestsQuery = useQuery({
    queryKey: ["admin", "service-requests"],
    queryFn: fetchAdminServiceRequests
  });
  const [resourceId, setResourceId] = useState("");
  const [activityId, setActivityId] = useState("");

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
  const selectedNotification = notificationsQuery.data?.[0] ?? null;
  const selectedServiceRequest = serviceRequestsQuery.data?.[0] ?? null;

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
        activitiesQuery.data?.filter((activity) => activity.status === "published").length ?? 0
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
  const notificationStats = useMemo(
    () => ({
      total: notificationsQuery.data?.length ?? 0,
      published:
        notificationsQuery.data?.filter((notification) => notification.status === "published")
          .length ?? 0
    }),
    [notificationsQuery.data]
  );
  const serviceRequestStats = useMemo(
    () => ({
      total: serviceRequestsQuery.data?.length ?? 0,
      open:
        serviceRequestsQuery.data?.filter(
          (request) => request.status !== "resolved" && request.status !== "closed"
        ).length ?? 0
    }),
    [serviceRequestsQuery.data]
  );

  if (
    resourcesQuery.isLoading ||
    activitiesQuery.isLoading ||
    rulesQuery.isLoading ||
    notificationsQuery.isLoading ||
    serviceRequestsQuery.isLoading
  ) {
    return (
      <PageSection
        title={localeText(locale, "今日维护概览", "Today's Operations")}
        description={localeText(
          locale,
          "教师工作台首页优先展示今日维护范围。",
          "The admin homepage prioritizes today's operational scope."
        )}
      >
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入后台总览", "Loading admin overview")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      </PageSection>
    );
  }

  if (
    resourcesQuery.isError ||
    activitiesQuery.isError ||
    rulesQuery.isError ||
    notificationsQuery.isError ||
    serviceRequestsQuery.isError
  ) {
    const error =
      (resourcesQuery.error as ApiError | null) ??
      (activitiesQuery.error as ApiError | null) ??
      (rulesQuery.error as ApiError | null) ??
      (notificationsQuery.error as ApiError | null) ??
      (serviceRequestsQuery.error as ApiError | null);

    return (
      <PageSection
        title={localeText(locale, "今日维护概览", "Today's Operations")}
        description={localeText(
          locale,
          "教师工作台首页优先展示今日维护范围。",
          "The admin homepage prioritizes today's operational scope."
        )}
      >
        <StatePanel
          tone="danger"
          title={localeText(locale, "后台总览暂时无法加载", "Admin overview is unavailable")}
          description={error?.message ?? "request-failed"}
        />
      </PageSection>
    );
  }

  return (
    <PageSection
      title={localeText(locale, "今日维护概览", "Today's Operations")}
      description={localeText(
        locale,
        "教师工作台首页优先展示今天最需要关注的维护范围、当前选中对象和快捷入口。",
        "The admin homepage highlights today's scope, current targets, and the fastest entry points."
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),360px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard
            label={localeText(locale, "资源总数", "Resources")}
            value={String(resourceStats.resourceCount)}
            detail={localeText(locale, "覆盖学术空间与体育设施", "Study spaces and sports facilities")}
          />
          <AdminStatCard
            label={localeText(locale, "资源单元", "Resource Units")}
            value={String(resourceStats.unitCount)}
            detail={localeText(locale, "用于预约与组合资源校验", "Used for booking and grouped resource validation")}
          />
          <AdminStatCard
            label={localeText(locale, "活动数量", "Activities")}
            value={String(activityStats.total)}
            detail={localeText(locale, "统一维护活动、票种和状态", "Manage activities, tickets, and statuses")}
          />
          <AdminStatCard
            label={localeText(locale, "规则数量", "Rules")}
            value={String(ruleStats.total)}
            detail={localeText(locale, "绑定资源并进入预约主流程", "Bound to resources and enforced in booking")}
          />
          <AdminStatCard
            label={localeText(locale, "通知数量", "Notices")}
            value={String(notificationStats.total)}
            detail={localeText(
              locale,
              `${notificationStats.published} 条已发布`,
              `${notificationStats.published} published`
            )}
          />
          <AdminStatCard
            label={localeText(locale, "工单数量", "Service Requests")}
            value={String(serviceRequestStats.total)}
            detail={localeText(
              locale,
              `${serviceRequestStats.open} 条待处理`,
              `${serviceRequestStats.open} open`
            )}
          />
        </div>

        <div className="grid gap-4">
          <QuickWorkspaceCard
            title={localeText(locale, "资源工作区", "Resource Workspace")}
            description={localeText(
              locale,
              "适合补资源、补单元和核对当前资源结构。",
              "Best for creating resources, adding units, and checking structure."
            )}
            action={localeText(locale, "进入资源维护", "Open Resources")}
            onClick={() => onSelectWorkspace("resources")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "活动工作区", "Activity Workspace")}
            description={localeText(
              locale,
              "适合创建活动、补票种和切换活动发布状态。",
              "Best for creating activities, adding tickets, and switching status."
            )}
            action={localeText(locale, "进入活动维护", "Open Activities")}
            onClick={() => onSelectWorkspace("activities")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "通知工作区", "Notification Workspace")}
            description={localeText(
              locale,
              "适合编辑首页通知、保存草稿和直接发布。",
              "Best for drafting, editing, and publishing homepage notices."
            )}
            action={localeText(locale, "进入通知发布", "Open Notices")}
            onClick={() => onSelectWorkspace("notifications")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "工单工作区", "Service Request Workspace")}
            description={localeText(
              locale,
              "适合集中查看学生报修记录并更新处理状态。",
              "Best for reviewing student repair tickets and updating status."
            )}
            action={localeText(locale, "进入工单处理", "Open Requests")}
            onClick={() => onSelectWorkspace("serviceRequests")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "规则工作区", "Rule Workspace")}
            description={localeText(
              locale,
              "适合检查当前规则数量、启用状态和资源绑定规模。",
              "Best for checking rule count, status, and binding scope."
            )}
            action={localeText(locale, "进入规则查看", "Open Rules")}
            onClick={() => onSelectWorkspace("rules")}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr),420px]">
        <HighlightPanel
          eyebrow={localeText(locale, "管理工作区", "Admin Workspace")}
          title={localeText(
            locale,
            "围绕实际维护任务组织后台，而不是围绕接口字段组织页面",
            "Organize the admin around operational tasks, not raw interface fields"
          )}
          description={localeText(
            locale,
            "资源维护会影响预约入口，活动维护会影响抢票体验，规则维护会影响资格和限制，通知发布会影响首页曝光，工单处理会影响线下服务响应。",
            "Resources affect booking entry, activities affect registration, rules affect eligibility, notices affect homepage messaging, and service requests affect offline response."
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <WorkspaceBadge
              label={localeText(locale, "资源", "Resources")}
              value={localeText(locale, `${resourceStats.resourceCount} 项`, `${resourceStats.resourceCount}`)}
            />
            <WorkspaceBadge
              label={localeText(locale, "活动", "Activities")}
              value={localeText(
                locale,
                `${activityStats.published} 场已发布`,
                `${activityStats.published} published`
              )}
            />
            <WorkspaceBadge
              label={localeText(locale, "规则", "Rules")}
              value={localeText(locale, `${ruleStats.active} 条启用`, `${ruleStats.active} active`)}
            />
            <WorkspaceBadge
              label={localeText(locale, "通知", "Notices")}
              value={localeText(
                locale,
                `${notificationStats.published} 条已发布`,
                `${notificationStats.published} published`
              )}
            />
            <WorkspaceBadge
              label={localeText(locale, "工单", "Requests")}
              value={localeText(
                locale,
                `${serviceRequestStats.open} 条待处理`,
                `${serviceRequestStats.open} open`
              )}
            />
          </div>
        </HighlightPanel>

        <StepList
          items={[
            {
              title: localeText(locale, "先判断今天维护什么", "Choose today's focus"),
              description: localeText(
                locale,
                "先在总览、资源、活动、规则、通知和工单之间切换到当前工作区。",
                "Start by switching to the workspace that matches today's task."
              )
            },
            {
              title: localeText(locale, "再查看选中对象详情", "Inspect the current target"),
              description: localeText(
                locale,
                "先看当前资源、活动、通知或工单的现状，再决定是新增、补充还是调整状态。",
                "Review the current resource, activity, notice, or request before changing it."
              )
            },
            {
              title: localeText(locale, "最后再执行写操作", "Then apply changes"),
              description: localeText(
                locale,
                "创建资源、补票种、发布通知或更新工单状态，都应在同一工作区内完成。",
                "Create resources, add tickets, publish notices, or update request statuses inside the matching workspace."
              )
            }
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-5">
        <OverviewPanel
          title={localeText(locale, "当前选中资源", "Selected Resource")}
          eyebrow={localeText(locale, "资源快照", "Resource Snapshot")}
          empty={localeText(locale, "还没有选中资源。", "No resource selected yet.")}
        >
          {selectedResource ? (
            <>
              <p className="text-lg font-semibold text-ink">{selectedResource.name}</p>
              <p className="mt-2 text-sm text-slate">
                {resourceTypeLabel(selectedResource.type, locale)} ·{" "}
                {localeText(
                  locale,
                  `${selectedResource.units.length} 个单元`,
                  `${selectedResource.units.length} units`
                )}
              </p>
              <p className="mt-2 text-sm text-slate">
                {selectedResource.location || localeText(locale, "未填写位置", "No location")}
              </p>
            </>
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title={localeText(locale, "当前选中活动", "Selected Activity")}
          eyebrow={localeText(locale, "活动快照", "Activity Snapshot")}
          empty={localeText(locale, "还没有选中活动。", "No activity selected yet.")}
        >
          {selectedActivity ? (
            <>
              <p className="text-lg font-semibold text-ink">{selectedActivity.title}</p>
              <p className="mt-2 text-sm text-slate">
                {activityStatusLabel(selectedActivity.status, locale)} ·{" "}
                {localeText(
                  locale,
                  `${selectedActivity.tickets.length} 个票种`,
                  `${selectedActivity.tickets.length} ticket types`
                )}
              </p>
              <p className="mt-2 text-sm text-slate">
                {localeText(
                  locale,
                  `${formatDateTime(selectedActivity.saleStartTime)} 开售`,
                  `Sales start ${formatDateTime(selectedActivity.saleStartTime)}`
                )}
              </p>
            </>
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title={localeText(locale, "最新通知", "Latest Notice")}
          eyebrow={localeText(locale, "通知快照", "Notice Snapshot")}
          empty={localeText(locale, "当前还没有通知。", "No notices yet.")}
        >
          {selectedNotification ? (
            <>
              <p className="text-lg font-semibold text-ink">{selectedNotification.title}</p>
              <p className="mt-2 text-sm text-slate">
                {notificationStatusLabel(selectedNotification.status, locale)}
              </p>
              <p className="mt-2 text-sm text-slate">
                {selectedNotification.summary ||
                  selectedNotification.content.slice(0, 72)}
              </p>
            </>
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title={localeText(locale, "最新工单", "Latest Request")}
          eyebrow={localeText(locale, "工单快照", "Request Snapshot")}
          empty={localeText(locale, "当前还没有工单。", "No service requests yet.")}
        >
          {selectedServiceRequest ? (
            <>
              <p className="text-lg font-semibold text-ink">{selectedServiceRequest.title}</p>
              <p className="mt-2 text-sm text-slate">
                {selectedServiceRequest.userEmail} ·{" "}
                {serviceRequestStatusLabel(selectedServiceRequest.status, locale)}
              </p>
              <p className="mt-2 text-sm text-slate">{selectedServiceRequest.location}</p>
            </>
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title={localeText(locale, "规则概况", "Rule Snapshot")}
          eyebrow={localeText(locale, "规则快照", "Rule Snapshot")}
          empty={localeText(locale, "当前还没有规则快照。", "No rule snapshot yet.")}
        >
          {rulesQuery.data?.length ? (
            <>
              <p className="text-lg font-semibold text-ink">
                {localeText(locale, `${ruleStats.active} 条启用中`, `${ruleStats.active} active`)}
              </p>
              <p className="mt-2 text-sm text-slate">
                {localeText(
                  locale,
                  `总绑定资源数：${ruleStats.bindings}`,
                  `Total bindings: ${ruleStats.bindings}`
                )}
              </p>
              <p className="mt-2 text-sm text-slate">
                {localeText(locale, "最常见类型：", "Most common type: ")}
                {rulesQuery.data[0]
                  ? ruleTypeLabel(rulesQuery.data[0].ruleType, locale)
                  : localeText(locale, "未知", "Unknown")}
              </p>
            </>
          ) : null}
        </OverviewPanel>
      </div>

      <div className="mt-6">
        <HighlightPanel
          eyebrow={localeText(locale, "今日入口", "Today Update")}
          title={localeText(locale, "今日功能更新与维护入口", "Today's entry points")}
          description={localeText(
            locale,
            "当前工作台已经可以直接进入资源维护、活动维护、规则查看、通知编辑发布和工单处理入口。学生首页只负责展示结果，不再承担后台写操作。",
            "The workspace now exposes maintenance, activity, rule, notice, and service request entry points directly. The student homepage only displays results and no longer carries admin write flows."
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <WorkspaceBadge
              label={localeText(locale, "资源维护", "Resources")}
              value={localeText(locale, `${resourceStats.resourceCount} 项`, `${resourceStats.resourceCount}`)}
            />
            <WorkspaceBadge
              label={localeText(locale, "活动维护", "Activities")}
              value={localeText(locale, `${activityStats.total} 场`, `${activityStats.total}`)}
            />
            <WorkspaceBadge
              label={localeText(locale, "规则查看", "Rules")}
              value={localeText(locale, `${ruleStats.total} 条`, `${ruleStats.total}`)}
            />
            <WorkspaceBadge
              label={localeText(locale, "通知发布", "Notices")}
              value={localeText(
                locale,
                `${notificationStats.published} 条已发布`,
                `${notificationStats.published} published`
              )}
            />
            <WorkspaceBadge
              label={localeText(locale, "工单处理", "Requests")}
              value={localeText(
                locale,
                `${serviceRequestStats.open} 条待处理`,
                `${serviceRequestStats.open} open`
              )}
            />
          </div>
        </HighlightPanel>
      </div>
    </PageSection>
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

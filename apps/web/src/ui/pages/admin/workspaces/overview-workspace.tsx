import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { fetchAdminActivities } from "../../../../lib/api/activity-api";
import { fetchAdminNotifications } from "../../../../lib/api/notification-api";
import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { fetchAdminServiceRequests } from "../../../../lib/api/service-request-api";
import { formatDateTime } from "../../../../lib/date";
import { getErrorMessage } from "../../../../lib/http/errors";
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
  const notificationsQuery = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: fetchAdminNotifications
  });
  const serviceRequestsQuery = useQuery({
    queryKey: ["admin", "service-requests"],
    queryFn: fetchAdminServiceRequests
  });

  const sportsResources = useMemo(
    () =>
      (resourcesQuery.data ?? []).filter((resource) => resource.type === "sports_facility"),
    [resourcesQuery.data]
  );
  const academicResources = useMemo(
    () =>
      (resourcesQuery.data ?? []).filter((resource) => resource.type === "academic_space"),
    [resourcesQuery.data]
  );
  const selectedSportsVenue = sportsResources[0] ?? null;
  const selectedAcademicSpace = academicResources[0] ?? null;
  const selectedActivity = activitiesQuery.data?.[0] ?? null;
  const selectedNotification = notificationsQuery.data?.[0] ?? null;
  const selectedServiceRequest = serviceRequestsQuery.data?.[0] ?? null;

  const resourceStats = useMemo(
    () => ({
      sportsVenueCount: sportsResources.length,
      academicSpaceCount: academicResources.length,
      unitCount:
        (resourcesQuery.data ?? []).reduce(
          (total, resource) => total + resource.units.length,
          0
        ) ?? 0
    }),
    [academicResources.length, resourcesQuery.data, sportsResources.length]
  );
  const activityStats = useMemo(
    () => ({
      total: activitiesQuery.data?.length ?? 0,
      published:
        activitiesQuery.data?.filter((activity) => activity.status === "published").length ?? 0
    }),
    [activitiesQuery.data]
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
    notificationsQuery.isLoading ||
    serviceRequestsQuery.isLoading
  ) {
    return (
      <PageSection
        title={localeText(locale, "运营总揽", "Operations Hub")}
        description={localeText(
          locale,
          "教师工作台首页优先展示今天需要处理的业务域和维护入口。",
          "The admin homepage prioritizes today's domains and maintenance entry points."
        )}
      >
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入运营总揽", "Loading operations hub")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      </PageSection>
    );
  }

  if (
    resourcesQuery.isError ||
    activitiesQuery.isError ||
    notificationsQuery.isError ||
    serviceRequestsQuery.isError
  ) {
    const error =
      resourcesQuery.error ??
      activitiesQuery.error ??
      notificationsQuery.error ??
      serviceRequestsQuery.error;

    return (
      <PageSection
        title={localeText(locale, "运营总揽", "Operations Hub")}
        description={localeText(
          locale,
          "教师工作台首页优先展示今天需要处理的业务域和维护入口。",
          "The admin homepage prioritizes today's domains and maintenance entry points."
        )}
      >
        <StatePanel
          tone="danger"
          title={localeText(locale, "运营总揽暂时无法加载", "Operations hub is unavailable")}
          description={getErrorMessage(error)}
        />
      </PageSection>
    );
  }

  return (
    <PageSection
      title={localeText(locale, "运营总揽", "Operations Hub")}
      description={localeText(
        locale,
        "先判断今天要维护的是体育场馆、学术空间、活动、通知还是工单，再进入对应模块处理。",
        "Decide whether today's task belongs to sports venues, academic spaces, activities, notices, or service repairs first, then jump into the matching module."
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),360px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard
            label={localeText(locale, "体育场馆", "Sports Venues")}
            value={String(resourceStats.sportsVenueCount)}
            detail={localeText(locale, "集中维护球场与体育设施", "Manage courts and sports facilities")}
          />
          <AdminStatCard
            label={localeText(locale, "学术空间", "Academic Spaces")}
            value={String(resourceStats.academicSpaceCount)}
            detail={localeText(locale, "按 E1/E2/E3/E4 等区域组织", "Grouped by E1/E2/E3/E4-style areas")}
          />
          <AdminStatCard
            label={localeText(locale, "资源单元", "Resource Units")}
            value={String(resourceStats.unitCount)}
            detail={localeText(locale, "支撑预约与场地可用性校验", "Support booking and availability checks")}
          />
          <AdminStatCard
            label={localeText(locale, "活动管理", "Activities")}
            value={String(activityStats.total)}
            detail={localeText(locale, "维护活动、票种和状态", "Manage activities, tickets, and statuses")}
          />
          <AdminStatCard
            label={localeText(locale, "通知发布", "Notices")}
            value={String(notificationStats.total)}
            detail={localeText(
              locale,
              `${notificationStats.published} 条已发布`,
              `${notificationStats.published} published`
            )}
          />
          <AdminStatCard
            label={localeText(locale, "工单维修", "Service Repairs")}
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
            title={localeText(locale, "体育场馆", "Sports Venues")}
            description={localeText(
              locale,
              "适合维护篮球场、羽毛球场、网球场等体育设施及其场地单元。",
              "Best for managing basketball, badminton, tennis, and other sports facilities with their court units."
            )}
            action={localeText(locale, "进入体育场馆", "Open Sports Venues")}
            onClick={() => onSelectWorkspace("sportsVenues")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "学术空间", "Academic Spaces")}
            description={localeText(
              locale,
              "适合按 E1/E2/E3/E4 等区域管理房间、自习室和创新协作空间。",
              "Best for managing rooms, study spaces, and collaboration areas by E1/E2/E3/E4-style zones."
            )}
            action={localeText(locale, "进入学术空间", "Open Academic Spaces")}
            onClick={() => onSelectWorkspace("academicSpaces")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "活动管理", "Activity Management")}
            description={localeText(
              locale,
              "适合创建活动、补票种和切换活动发布状态。",
              "Best for creating activities, adding tickets, and switching publishing status."
            )}
            action={localeText(locale, "进入活动管理", "Open Activities")}
            onClick={() => onSelectWorkspace("activities")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "通知发布", "Notice Publishing")}
            description={localeText(
              locale,
              "适合编辑首页通知、保存草稿和直接发布。",
              "Best for drafting, editing, and publishing homepage notices."
            )}
            action={localeText(locale, "进入通知发布", "Open Notices")}
            onClick={() => onSelectWorkspace("notifications")}
          />
          <QuickWorkspaceCard
            title={localeText(locale, "工单维修", "Service Repairs")}
            description={localeText(
              locale,
              "适合集中查看学生报修记录并更新处理状态。",
              "Best for reviewing student repair tickets and updating status."
            )}
            action={localeText(locale, "进入工单维修", "Open Repairs")}
            onClick={() => onSelectWorkspace("serviceRequests")}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr),420px]">
        <HighlightPanel
          eyebrow={localeText(locale, "业务域入口", "Business Domains")}
          title={localeText(
            locale,
            "后台围绕真实维护对象组织，而不是围绕技术模块命名",
            "Organize the admin around real maintenance domains, not technical module names"
          )}
          description={localeText(
            locale,
            "体育场馆与学术空间已经拆成独立入口；活动、通知与工单保留原有能力；规则系统继续保留在后端执行层，但不再占据一级导航。",
            "Sports venues and academic spaces now have separate entry points. Activities, notices, and service repairs keep their existing capabilities. The rule engine remains in the backend execution layer, but no longer occupies the primary navigation."
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <WorkspaceBadge
              label={localeText(locale, "体育场馆", "Sports")}
              value={localeText(
                locale,
                `${resourceStats.sportsVenueCount} 项`,
                `${resourceStats.sportsVenueCount}`
              )}
            />
            <WorkspaceBadge
              label={localeText(locale, "学术空间", "Academic")}
              value={localeText(
                locale,
                `${resourceStats.academicSpaceCount} 项`,
                `${resourceStats.academicSpaceCount}`
              )}
            />
            <WorkspaceBadge
              label={localeText(locale, "活动管理", "Activities")}
              value={localeText(locale, `${activityStats.total} 场`, `${activityStats.total}`)}
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
              label={localeText(locale, "工单维修", "Repairs")}
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
              title: localeText(locale, "先判断业务域", "Pick the domain first"),
              description: localeText(
                locale,
                "先判断当前任务属于体育场馆、学术空间、活动管理、通知发布还是工单维修。",
                "Decide whether the task belongs to sports venues, academic spaces, activity management, notice publishing, or service repairs."
              )
            },
            {
              title: localeText(locale, "再查看当前对象", "Inspect the current item"),
              description: localeText(
                locale,
                "先看当前场馆、空间、活动、通知或工单的现状，再决定是新增、补充还是调整状态。",
                "Review the current venue, space, activity, notice, or request before deciding whether to create, complete, or update it."
              )
            },
            {
              title: localeText(locale, "最后执行写操作", "Then apply changes"),
              description: localeText(
                locale,
                "创建资源、补单元、发布通知或更新工单状态，都应在同一业务域内完成。",
                "Create resources, add units, publish notices, or update request statuses inside the matching business domain."
              )
            }
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-5">
        <OverviewPanel
          title={localeText(locale, "当前体育场馆", "Current Sports Venue")}
          eyebrow={localeText(locale, "体育快照", "Sports Snapshot")}
          empty={localeText(locale, "当前还没有体育场馆。", "No sports venues yet.")}
        >
          {selectedSportsVenue ? (
            <>
              <p className="text-lg font-semibold text-ink">{selectedSportsVenue.name}</p>
              <p className="mt-2 text-sm text-slate">
                {localeText(
                  locale,
                  `${selectedSportsVenue.units.length} 个单元`,
                  `${selectedSportsVenue.units.length} units`
                )}
              </p>
              <p className="mt-2 text-sm text-slate">
                {selectedSportsVenue.location || localeText(locale, "未填写位置", "No location")}
              </p>
            </>
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title={localeText(locale, "当前学术空间", "Current Academic Space")}
          eyebrow={localeText(locale, "学术快照", "Academic Snapshot")}
          empty={localeText(locale, "当前还没有学术空间。", "No academic spaces yet.")}
        >
          {selectedAcademicSpace ? (
            <>
              <p className="text-lg font-semibold text-ink">{selectedAcademicSpace.name}</p>
              <p className="mt-2 text-sm text-slate">
                {selectedAcademicSpace.code} ·{" "}
                {localeText(
                  locale,
                  `${selectedAcademicSpace.units.length} 个单元`,
                  `${selectedAcademicSpace.units.length} units`
                )}
              </p>
              <p className="mt-2 text-sm text-slate">
                {selectedAcademicSpace.location || localeText(locale, "未填写位置", "No location")}
              </p>
            </>
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title={localeText(locale, "当前活动", "Current Activity")}
          eyebrow={localeText(locale, "活动快照", "Activity Snapshot")}
          empty={localeText(locale, "当前还没有活动。", "No activities yet.")}
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
          eyebrow={localeText(locale, "工单快照", "Repair Snapshot")}
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

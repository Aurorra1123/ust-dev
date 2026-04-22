import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchAdminNotifications } from "../../../../lib/api/notification-api";
import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { fetchAdminServiceRequests } from "../../../../lib/api/service-request-api";
import { getErrorMessage } from "../../../../lib/http/errors";
import { localeText } from "../../../../lib/locale";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel } from "../../../user-experience-kit";
import type { WorkspaceTab } from "../admin-helpers";
import { AdminStatCard } from "../components/admin-stat-card";
import { QuickWorkspaceCard } from "../components/quick-workspace-card";

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
  const notificationsQuery = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: fetchAdminNotifications
  });
  const serviceRequestsQuery = useQuery({
    queryKey: ["admin", "service-requests"],
    queryFn: fetchAdminServiceRequests
  });

  const resourceCounts = useMemo(
    () => ({
      sports: (resourcesQuery.data ?? []).filter((resource) => resource.type === "sports_facility")
        .length,
      academic: (resourcesQuery.data ?? []).filter(
        (resource) => resource.type === "academic_space"
      ).length,
      withoutUnits: (resourcesQuery.data ?? []).filter((resource) => resource.units.length === 0)
        .length
    }),
    [resourcesQuery.data]
  );
  const draftNotificationCount = useMemo(
    () =>
      notificationsQuery.data?.filter((notification) => notification.status === "draft")
        .length ?? 0,
    [notificationsQuery.data]
  );
  const pendingServiceRequestCount = useMemo(
    () =>
      serviceRequestsQuery.data?.filter(
        (request) => request.status !== "resolved" && request.status !== "closed"
      ).length ?? 0,
    [serviceRequestsQuery.data]
  );

  if (resourcesQuery.isLoading || notificationsQuery.isLoading || serviceRequestsQuery.isLoading) {
    return (
      <PageSection
        title={localeText(locale, "运营总揽", "Operations Hub")}
        description={localeText(
          locale,
          "汇总今天需要关注的业务入口和待办事项，方便快速进入对应模块。",
          "This page highlights the business areas and to-dos that may need attention today."
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

  if (resourcesQuery.isError || notificationsQuery.isError || serviceRequestsQuery.isError) {
    const error =
      resourcesQuery.error ?? notificationsQuery.error ?? serviceRequestsQuery.error;

    return (
      <PageSection
        title={localeText(locale, "运营总揽", "Operations Hub")}
        description={localeText(
          locale,
          "汇总今天需要关注的业务入口和待办事项，方便快速进入对应模块。",
          "This page highlights the business areas and to-dos that may need attention today."
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
        "汇总今天需要关注的业务入口和待办事项，方便快速进入对应模块。",
        "This page highlights the business areas and to-dos that may need attention today."
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <QuickWorkspaceCard
          title={localeText(locale, "体育场馆", "Sports Venues")}
          description={localeText(
            locale,
            "维护篮球场、羽毛球场、网球场等体育资源及其场地单元。",
            "Maintain sports resources such as basketball, badminton, and tennis venues together with their court units."
          )}
          action={localeText(locale, "进入体育场馆", "Open Sports Venues")}
          onClick={() => onSelectWorkspace("sportsVenues")}
        />
        <QuickWorkspaceCard
          title={localeText(locale, "学术空间", "Academic Spaces")}
          description={localeText(
            locale,
            "按 E1/E2/E3/E4 等区域管理房间、自习室和创新协作空间。",
            "Manage rooms, study spaces, and collaboration areas by E1/E2/E3/E4-style zones."
          )}
          action={localeText(locale, "进入学术空间", "Open Academic Spaces")}
          onClick={() => onSelectWorkspace("academicSpaces")}
        />
        <QuickWorkspaceCard
          title={localeText(locale, "活动管理", "Activity Management")}
          description={localeText(
            locale,
            "创建活动、补票种并切换活动发布状态。",
            "Create activities, add ticket types, and switch publishing states."
          )}
          action={localeText(locale, "进入活动管理", "Open Activities")}
          onClick={() => onSelectWorkspace("activities")}
        />
        <QuickWorkspaceCard
          title={localeText(locale, "通知发布", "Notice Publishing")}
          description={localeText(
            locale,
            "编辑首页通知、保存草稿并完成发布。",
            "Edit homepage notices, keep drafts, and publish updates."
          )}
          action={localeText(locale, "进入通知发布", "Open Notices")}
          onClick={() => onSelectWorkspace("notifications")}
        />
        <QuickWorkspaceCard
          title={localeText(locale, "工单维修", "Service Repairs")}
          description={localeText(
            locale,
            "集中查看学生报修记录并推进处理状态。",
            "Review student repair tickets and move their handling status forward."
          )}
          action={localeText(locale, "进入工单维修", "Open Repairs")}
          onClick={() => onSelectWorkspace("serviceRequests")}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={localeText(locale, "待处理工单", "Open Repairs")}
          value={String(pendingServiceRequestCount)}
          detail={localeText(
            locale,
            "优先处理仍未关闭的报修请求。",
            "Handle repair requests that are still not closed."
          )}
        />
        <AdminStatCard
          label={localeText(locale, "草稿通知", "Draft Notices")}
          value={String(draftNotificationCount)}
          detail={localeText(
            locale,
            "还有通知停留在草稿状态，必要时补完并发布。",
            "Some notices are still drafts and may need to be completed and published."
          )}
        />
        <AdminStatCard
          label={localeText(locale, "未配置单元资源", "Resources Without Units")}
          value={String(resourceCounts.withoutUnits)}
          detail={localeText(
            locale,
            `当前覆盖体育场馆 ${resourceCounts.sports} 项、学术空间 ${resourceCounts.academic} 项中的配置缺口。`,
            `Shows configuration gaps across ${resourceCounts.sports} sports venues and ${resourceCounts.academic} academic spaces.`
          )}
        />
      </div>
    </PageSection>
  );
}

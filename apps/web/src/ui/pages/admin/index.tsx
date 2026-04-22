import { useState } from "react";

import { localeText } from "../../../lib/locale";
import { useLocaleStore } from "../../../store/locale-store";
import { AcademicSpacesWorkspace } from "./workspaces/academic-spaces-workspace";
import { PageHero } from "../../page-hero";
import { workspaceTabLabel, type WorkspaceTab } from "./admin-helpers";
import { ActivitiesWorkspace } from "./workspaces/activities-workspace";
import { NotificationsWorkspace } from "./workspaces/notifications-workspace";
import { OverviewWorkspace } from "./workspaces/overview-workspace";
import { ServiceRequestsWorkspace } from "./workspaces/service-requests-workspace";
import { SportsVenuesWorkspace } from "./workspaces/sports-venues-workspace";

const workspaceTabs: WorkspaceTab[] = [
  "overview",
  "sportsVenues",
  "academicSpaces",
  "activities",
  "notifications",
  "serviceRequests"
];

export function AdminPage() {
  const locale = useLocaleStore((state) => state.locale);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("overview");

  return (
    <>
      <PageHero
        eyebrow="Teacher Workspace"
        title={localeText(locale, "教师工作台", "Teacher Workspace")}
        description={localeText(
          locale,
          "登录后直接进入工作台，围绕运营总揽、体育场馆、学术空间、活动管理、通知发布与工单维修展开日常操作。这里不再混入学生端入口，而是聚焦今天需要处理的维护事务。",
          "After signing in, teachers land directly in the workspace for the operations hub, sports venues, academic spaces, activity management, notice publishing, and service repairs. The page focuses on today's maintenance work instead of student-facing entries."
        )}
        aside={
          <>
            <p className="font-medium text-ink">{localeText(locale, "当前工作区", "Current Workspace")}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">
              {workspaceTabLabel(workspaceTab, locale)}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate">
              {localeText(
                locale,
                "后台入口现在只负责切换业务域；体育场馆、学术空间、活动、通知和工单的数据查询与写操作都已下放到各自 workspace，不再把整套后台状态挤在一个页面组件里。",
                "The admin entry now only switches business domains. Sports venues, academic spaces, activities, notices, and service repairs now keep their own data and write flows instead of one giant page component."
              )}
            </p>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2 rounded-[28px] border border-navy/10 bg-white px-5 py-5 shadow-panel">
        {workspaceTabs.map((value) => (
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
            {workspaceTabLabel(value, locale)}
          </button>
        ))}
      </div>

      {workspaceTab === "overview" ? (
        <OverviewWorkspace locale={locale} onSelectWorkspace={setWorkspaceTab} />
      ) : null}
      {workspaceTab === "sportsVenues" ? <SportsVenuesWorkspace locale={locale} /> : null}
      {workspaceTab === "academicSpaces" ? <AcademicSpacesWorkspace locale={locale} /> : null}
      {workspaceTab === "activities" ? <ActivitiesWorkspace locale={locale} /> : null}
      {workspaceTab === "notifications" ? <NotificationsWorkspace locale={locale} /> : null}
      {workspaceTab === "serviceRequests" ? (
        <ServiceRequestsWorkspace locale={locale} />
      ) : null}
    </>
  );
}

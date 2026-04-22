import { useState } from "react";

import { localeText } from "../../../lib/locale";
import { useLocaleStore } from "../../../store/locale-store";
import { AcademicSpacesWorkspace } from "./workspaces/academic-spaces-workspace";
import { PageHero } from "../../page-hero";
import { workspaceTabLabel, type WorkspaceTab } from "./admin-helpers";
import { ActivitiesWorkspace } from "./workspaces/activities-workspace";
import { NotificationsWorkspace } from "./workspaces/notifications-workspace";
import { OverviewWorkspace } from "./workspaces/overview-workspace";
import { RulesWorkspace } from "./workspaces/rules-workspace";
import { ServiceRequestsWorkspace } from "./workspaces/service-requests-workspace";
import { SportsVenuesWorkspace } from "./workspaces/sports-venues-workspace";

const workspaceTabs: WorkspaceTab[] = [
  "overview",
  "sportsVenues",
  "academicSpaces",
  "rulesConfig",
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
          "登录后可直接进入各业务模块，处理体育场馆、学术空间、规则配置、活动管理、通知发布与工单维修等日常事务。",
          "After signing in, teachers can move directly into each business area to handle sports venues, academic spaces, rule configuration, activities, notices, and service repairs."
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
                "当前工作区会显示你正在处理的业务模块，切换后即可查看对应数据与操作。",
                "The current workspace shows which business area you are working in, and each tab opens the related data and actions."
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
      {workspaceTab === "rulesConfig" ? <RulesWorkspace locale={locale} /> : null}
      {workspaceTab === "activities" ? <ActivitiesWorkspace locale={locale} /> : null}
      {workspaceTab === "notifications" ? <NotificationsWorkspace locale={locale} /> : null}
      {workspaceTab === "serviceRequests" ? (
        <ServiceRequestsWorkspace locale={locale} />
      ) : null}
    </>
  );
}

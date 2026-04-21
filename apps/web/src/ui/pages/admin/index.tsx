import { useState } from "react";

import { localeText } from "../../../lib/locale";
import { useLocaleStore } from "../../../store/locale-store";
import { PageHero } from "../../page-hero";
import { PageSection } from "../../page-section";
import { workspaceTabLabel, type WorkspaceTab } from "./admin-helpers";
import { ActivitiesWorkspace } from "./workspaces/activities-workspace";
import { OverviewWorkspace } from "./workspaces/overview-workspace";
import { ResourcesWorkspace } from "./workspaces/resources-workspace";
import { RulesWorkspace } from "./workspaces/rules-workspace";

const workspaceTabs: WorkspaceTab[] = [
  "overview",
  "resources",
  "activities",
  "rules"
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
          "登录后直接进入工作台，围绕资源、活动和规则维护展开日常操作。这里不再混入学生端入口，而是聚焦今天需要处理的服务更新。",
          "After signing in, teachers land directly in the workspace for resources, activities, and rule operations. The page focuses on today’s updates instead of student-facing entries."
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
                "后台入口现在只负责切换工作区；资源、活动和规则的数据查询与写操作都已下放到各自 workspace，不再把整套后台状态挤在一个页面组件里。",
                "The admin entry now only switches workspaces. Resource, activity, and rule queries and mutations live inside their own workspaces instead of one giant page component."
              )}
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
        }
      >
        <div className="rounded-[24px] border border-navy/10 bg-white px-5 py-4 text-sm leading-7 text-slate">
          {localeText(
            locale,
            "当前后台入口不再持有各工作区的 query、mutation 和表单状态；切换到对应 workspace 后，再进入资源、活动或规则的实际维护视图。",
            "The admin entry no longer owns each workspace query, mutation, and form state. Switch to the target workspace first, then enter the actual maintenance view for resources, activities, or rules."
          )}
        </div>
      </PageSection>

      {workspaceTab === "overview" ? (
        <OverviewWorkspace locale={locale} onSelectWorkspace={setWorkspaceTab} />
      ) : null}
      {workspaceTab === "resources" ? <ResourcesWorkspace locale={locale} /> : null}
      {workspaceTab === "activities" ? <ActivitiesWorkspace locale={locale} /> : null}
      {workspaceTab === "rules" ? <RulesWorkspace locale={locale} /> : null}
    </>
  );
}

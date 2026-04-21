import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { fetchAdminActivities } from "../../../../lib/api/activity-api";
import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { fetchAdminRules } from "../../../../lib/api/rule-api";
import { ApiError } from "../../../../lib/http/errors";
import { formatDateTime } from "../../../../lib/date";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import {
  HighlightPanel,
  StatePanel,
  StepList
} from "../../../user-experience-kit";
import {
  activityStatusLabel,
  resourceTypeLabel,
  ruleTypeLabel,
  type WorkspaceTab
} from "../admin-helpers";
import { AdminStatCard } from "../components/admin-stat-card";
import { QuickWorkspaceCard } from "../components/quick-workspace-card";
import { WorkspaceBadge } from "../components/workspace-badge";

export function OverviewWorkspace({
  locale: _locale,
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

  if (resourcesQuery.isLoading || activitiesQuery.isLoading || rulesQuery.isLoading) {
    return (
      <PageSection title="今日维护概览" description="教师工作台首页优先展示今日维护范围。">
        <StatePanel tone="loading" title="正在载入后台总览" description="请稍候。" />
      </PageSection>
    );
  }

  if (resourcesQuery.isError || activitiesQuery.isError || rulesQuery.isError) {
    const error =
      (resourcesQuery.error as ApiError | null) ??
      (activitiesQuery.error as ApiError | null) ??
      (rulesQuery.error as ApiError | null);

    return (
      <PageSection title="今日维护概览" description="教师工作台首页优先展示今日维护范围。">
        <StatePanel
          tone="danger"
          title="后台总览暂时无法加载"
          description={error?.message ?? "request-failed"}
        />
      </PageSection>
    );
  }

  return (
    <PageSection
      title="今日维护概览"
      description="教师工作台首页优先展示今天最需要关注的维护范围、当前选中对象和快捷入口。"
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
            onClick={() => onSelectWorkspace("resources")}
          />
          <QuickWorkspaceCard
            title="活动工作区"
            description="适合创建活动、补票种和切换活动发布状态。"
            action="进入活动维护"
            onClick={() => onSelectWorkspace("activities")}
          />
          <QuickWorkspaceCard
            title="规则工作区"
            description="适合检查当前规则数量、启用状态和资源绑定规模。"
            action="进入规则查看"
            onClick={() => onSelectWorkspace("rules")}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr),420px]">
        <HighlightPanel
          eyebrow="Admin Workspace"
          title="围绕实际维护任务组织后台，而不是围绕接口字段组织页面"
          description="资源维护会影响预约入口，活动维护会影响抢票体验，规则维护会影响资格和限制。工作台化的目标是让管理员更快定位当前任务、更少在页面间迷路。"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <WorkspaceBadge label="资源" value={`${resourceStats.resourceCount} 项`} />
            <WorkspaceBadge label="活动" value={`${activityStats.published} 场已发布`} />
            <WorkspaceBadge label="规则" value={`${ruleStats.active} 条启用`} />
          </div>
        </HighlightPanel>

        <StepList
          items={[
            {
              title: "先判断今天维护什么",
              description: "先在总览、资源、活动和规则之间切换到当前工作区。"
            },
            {
              title: "再查看选中对象详情",
              description: "先看当前资源、活动或规则的现状，再决定是新增、补充还是调整状态。"
            },
            {
              title: "最后再执行写操作",
              description: "创建资源、补单元、加票种或切状态，都应在同一工作区内完成。"
            }
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <OverviewPanel title="当前选中资源" eyebrow="Selected Resource" empty="还没有选中资源。">
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

        <OverviewPanel title="当前选中活动" eyebrow="Selected Activity" empty="还没有选中活动。">
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

        <OverviewPanel title="规则概况" eyebrow="Rule Snapshot" empty="当前还没有规则快照。">
          {rulesQuery.data?.length ? (
            <>
              <p className="text-lg font-semibold text-ink">{ruleStats.active} 条启用中</p>
              <p className="mt-2 text-sm text-slate">总绑定资源数：{ruleStats.bindings}</p>
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

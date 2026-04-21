import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchAdminRules } from "../../../../lib/api/rule-api";
import { localeText } from "../../../../lib/locale";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel, StatusPill } from "../../../user-experience-kit";
import { ruleTypeLabel } from "../admin-helpers";
import { RuleSummaryRow } from "../components/rule-summary-row";

export function RulesWorkspace({ locale }: { locale: Locale }) {
  const rulesQuery = useQuery({
    queryKey: ["admin", "rules"],
    queryFn: fetchAdminRules
  });

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
    <PageSection
      title={localeText(locale, "规则工作区", "Rule Workspace")}
      description={localeText(
        locale,
        "规则当前以快照方式呈现，重点帮助管理员快速理解站点正在执行哪些限制，以及它们绑定了多少资源。",
        "Rules are currently shown as snapshots so admins can quickly understand which limits are active and how many resources they affect."
      )}
    >
      {rulesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入规则工作区", "Loading rule workspace")}
          description={localeText(
            locale,
            "页面正在整理当前启用的规则和资源绑定关系。",
            "Collecting active rules and their resource bindings."
          )}
        />
      ) : rulesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "规则工作区暂时无法加载", "Rule workspace is unavailable")}
          description={(rulesQuery.error as Error).message}
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
                      {ruleTypeLabel(rule.ruleType, locale)}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink">
                      {rule.name}
                    </p>
                  </div>
                  <StatusPill tone={rule.status === "active" ? "success" : "danger"}>
                    {rule.status === "active"
                      ? localeText(locale, "启用中", "Active")
                      : localeText(locale, "已停用", "Inactive")}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm text-slate">
                  {localeText(
                    locale,
                    `绑定资源：${rule.resourceIds.length || 0}`,
                    `Bound resources: ${rule.resourceIds.length || 0}`
                  )}
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
                {localeText(locale, "规则概览", "Rule Summary")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                {localeText(locale, "当前规则概况", "Current Rule Snapshot")}
              </h3>
              <div className="mt-5 grid gap-3">
                <RuleSummaryRow
                  label={localeText(locale, "规则总数", "Total Rules")}
                  value={String(ruleStats.total)}
                />
                <RuleSummaryRow
                  label={localeText(locale, "启用中", "Active")}
                  value={String(ruleStats.active)}
                />
                <RuleSummaryRow
                  label={localeText(locale, "资源绑定数", "Resource Bindings")}
                  value={String(ruleStats.bindings)}
                />
              </div>
            </div>

            <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
              <p className="text-xs uppercase tracking-[0.22em] text-moss">
                {localeText(locale, "使用说明", "Notes")}
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-slate">
                <p>
                  {localeText(
                    locale,
                    "规则目前会直接影响预约主流程中的信用分、角色和时长限制。",
                    "Rules directly affect credit score, role, and duration limits in the booking flow."
                  )}
                </p>
                <p>
                  {localeText(
                    locale,
                    "这一页先提供快照视图，帮助管理员快速确认站点当前正在执行哪些规则。",
                    "This page currently provides a snapshot so admins can quickly confirm which rules are active."
                  )}
                </p>
                <p>
                  {localeText(
                    locale,
                    "后续如进入更深的配置阶段，再继续补全更细的规则编辑体验。",
                    "A deeper rule editing experience can be added later if configuration grows more complex."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageSection>
  );
}

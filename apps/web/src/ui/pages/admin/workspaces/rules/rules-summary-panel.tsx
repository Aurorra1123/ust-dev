import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { RuleSummaryRow } from "../../components/rule-summary-row";

export function RulesSummaryPanel({
  locale,
  ruleStats
}: {
  locale: Locale;
  ruleStats: {
    total: number;
    active: number;
    bindings: number;
  };
}) {
  return (
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
              "最长预约时长规则可用于限制单次预约时长，例如最多 60 分钟。",
              "Use maximum duration rules to limit a single booking, for example to 60 minutes."
            )}
          </p>
          <p>
            {localeText(
              locale,
              "最低信用分和允许用户角色会在预约主流程中即时生效，不需要额外发布步骤。",
              "Minimum credit score and allowed role rules take effect immediately in the booking flow without an additional publish step."
            )}
          </p>
          <p>
            {localeText(
              locale,
              "删除规则前必须先解绑资源；如果只是临时失效，优先使用停用而不是删除。",
              "Unbind resources before deleting a rule. If you only need to pause it, deactivate instead of deleting."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

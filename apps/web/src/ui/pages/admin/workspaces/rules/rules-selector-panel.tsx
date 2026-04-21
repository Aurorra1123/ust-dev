import type { AppRule } from "@campusbook/shared-types";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatusPill } from "../../../../user-experience-kit";
import { ruleTypeLabel } from "../../admin-helpers";
import { describeRuleExpression, NEW_RULE_ID } from "./rules-workspace-helpers";

export function RulesSelectorPanel({
  locale,
  rules,
  selectedRuleId,
  onSelectRule
}: {
  locale: Locale;
  rules: AppRule[];
  selectedRuleId: string;
  onSelectRule: (ruleId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <button
        type="button"
        className={`rounded-[24px] border px-5 py-4 text-left transition ${
          selectedRuleId === NEW_RULE_ID
            ? "border-ember bg-gradient-to-br from-ember/10 to-white"
            : "border-dashed border-ink/15 bg-white hover:border-moss"
        }`}
        onClick={() => onSelectRule(NEW_RULE_ID)}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-moss">
          {localeText(locale, "新规则", "New Rule")}
        </p>
        <p className="mt-2 text-lg font-semibold text-ink">
          {localeText(locale, "创建规则", "Create Rule")}
        </p>
        <p className="mt-2 text-sm text-slate">
          {localeText(
            locale,
            "支持最低信用分、最长预约时长和允许用户角色。",
            "Supports minimum credit score, maximum duration, and allowed user roles."
          )}
        </p>
      </button>

      <div className="grid gap-3">
        {rules.map((rule) => (
          <button
            key={rule.id}
            type="button"
            className={`rounded-[24px] border px-5 py-4 text-left transition ${
              rule.id === selectedRuleId
                ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                : "border-ink/10 bg-white hover:border-moss"
            }`}
            onClick={() => onSelectRule(rule.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-moss">
                  {ruleTypeLabel(rule.ruleType, locale)}
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{rule.name}</p>
              </div>
              <StatusPill tone={rule.status === "active" ? "success" : "danger"}>
                {rule.status === "active"
                  ? localeText(locale, "启用", "Active")
                  : localeText(locale, "停用", "Inactive")}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm text-slate">{describeRuleExpression(rule, locale)}</p>
            <p className="mt-2 text-xs text-ink/50">
              {localeText(
                locale,
                `绑定资源 ${rule.resourceIds.length}`,
                `Bound resources ${rule.resourceIds.length}`
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

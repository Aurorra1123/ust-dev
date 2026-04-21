import type {
  AppRule,
  RuleExpression,
  RuleType,
  UserRole
} from "@campusbook/shared-types";

import { ApiError } from "../../../../../lib/http/errors";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";

export const NEW_RULE_ID = "__new_rule__";

export type RuleEditorState = {
  name: string;
  ruleType: RuleType;
  minCreditScore: number;
  maxDurationMinutes: number;
  allowedRoles: UserRole[];
};

export function createDefaultRuleEditorState(): RuleEditorState {
  return {
    name: "",
    ruleType: "max_duration_minutes",
    minCreditScore: 80,
    maxDurationMinutes: 60,
    allowedRoles: ["student"]
  };
}

export function buildRuleExpression(editor: RuleEditorState): RuleExpression {
  switch (editor.ruleType) {
    case "max_duration_minutes":
      return {
        max: editor.maxDurationMinutes
      };
    case "min_credit_score":
      return {
        min: editor.minCreditScore
      };
    case "allowed_user_roles":
      return {
        roles: editor.allowedRoles
      };
  }
}

export function toRuleEditorState(rule: AppRule): RuleEditorState {
  return {
    name: rule.name,
    ruleType: rule.ruleType,
    minCreditScore: rule.expression.min ?? 80,
    maxDurationMinutes: rule.expression.max ?? 60,
    allowedRoles: rule.expression.roles ?? ["student"]
  };
}

export function describeRuleExpression(rule: AppRule, locale: Locale) {
  switch (rule.ruleType) {
    case "max_duration_minutes":
      return localeText(
        locale,
        `最长预约 ${rule.expression.max ?? 0} 分钟`,
        `Maximum duration ${rule.expression.max ?? 0} minutes`
      );
    case "min_credit_score":
      return localeText(
        locale,
        `最低信用分 ${rule.expression.min ?? 0}`,
        `Minimum credit score ${rule.expression.min ?? 0}`
      );
    case "allowed_user_roles":
      return localeText(
        locale,
        `允许角色：${(rule.expression.roles ?? []).map((role) => roleLabel(role, locale)).join(" / ")}`,
        `Allowed roles: ${(rule.expression.roles ?? []).map((role) => roleLabel(role, locale)).join(" / ")}`
      );
  }
}

export function roleLabel(role: UserRole, locale: Locale) {
  return role === "student"
    ? localeText(locale, "学生", "Student")
    : localeText(locale, "管理员", "Admin");
}

export function formatRuleMutationError(error: unknown, locale: Locale) {
  const message = (error as ApiError).message;

  switch (message) {
    case "rule-delete-blocked-existing-bindings":
      return localeText(
        locale,
        "该规则仍绑定着资源或用户画像，不能直接删除。请先解绑后再删除。",
        "This rule is still bound to resources or user profiles. Remove those bindings before deleting it."
      );
    default:
      return message;
  }
}

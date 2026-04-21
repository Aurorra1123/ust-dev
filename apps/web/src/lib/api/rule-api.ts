import type {
  AppRule,
  RuleExpression,
  RuleStatus,
  RuleType
} from "@campusbook/shared-types";

import { requestJson } from "../http/client";

export interface CreateRulePayload {
  name: string;
  ruleType: RuleType;
  status?: RuleStatus;
  expression: RuleExpression;
}

export function fetchAdminRules() {
  return requestJson<AppRule[]>("/admin/rules");
}

export function createRule(payload: CreateRulePayload) {
  return requestJson<AppRule>("/admin/rules", {
    method: "POST",
    body: payload
  });
}

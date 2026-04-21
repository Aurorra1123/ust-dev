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

export function updateRule(
  ruleId: string,
  payload: Partial<CreateRulePayload>
) {
  return requestJson<AppRule>(`/admin/rules/${ruleId}`, {
    method: "PATCH",
    body: payload
  });
}

export function bindRuleToResource(ruleId: string, resourceId: string) {
  return requestJson<AppRule>(`/admin/rules/${ruleId}/bindings/resources/${resourceId}`, {
    method: "POST"
  });
}

export function unbindRuleFromResource(ruleId: string, resourceId: string) {
  return requestJson<AppRule>(`/admin/rules/${ruleId}/bindings/resources/${resourceId}`, {
    method: "DELETE"
  });
}

export function deleteRule(ruleId: string) {
  return requestJson<{ id: string }>(`/admin/rules/${ruleId}`, {
    method: "DELETE"
  });
}

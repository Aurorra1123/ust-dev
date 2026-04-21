import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AppRule,
  RuleExpression,
  RuleType,
  UserRole
} from "@campusbook/shared-types";

import {
  bindRuleToResource,
  createRule,
  deleteRule,
  fetchAdminRules,
  unbindRuleFromResource,
  updateRule
} from "../../../../lib/api/rule-api";
import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { ApiError } from "../../../../lib/http/errors";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel, StatusPill } from "../../../user-experience-kit";
import { resourceTypeLabel, ruleTypeLabel } from "../admin-helpers";
import { MutationState } from "../components/mutation-state";
import { RuleSummaryRow } from "../components/rule-summary-row";

const NEW_RULE_ID = "__new_rule__";

type RuleEditorState = {
  name: string;
  ruleType: RuleType;
  minCreditScore: number;
  maxDurationMinutes: number;
  allowedRoles: UserRole[];
};

function createDefaultRuleEditorState(): RuleEditorState {
  return {
    name: "最长预约时长 60 分钟",
    ruleType: "max_duration_minutes",
    minCreditScore: 80,
    maxDurationMinutes: 60,
    allowedRoles: ["student"]
  };
}

export function RulesWorkspace({ locale }: { locale: Locale }) {
  const rulesQuery = useQuery({
    queryKey: ["admin", "rules"],
    queryFn: fetchAdminRules
  });
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const [selectedRuleId, setSelectedRuleId] = useState(NEW_RULE_ID);
  const [editor, setEditor] = useState<RuleEditorState>(createDefaultRuleEditorState);

  useEffect(() => {
    if (selectedRuleId === NEW_RULE_ID) {
      return;
    }

    if (!rulesQuery.data?.some((rule) => rule.id === selectedRuleId)) {
      setSelectedRuleId(rulesQuery.data?.[0]?.id ?? NEW_RULE_ID);
    }
  }, [selectedRuleId, rulesQuery.data]);

  const selectedRule =
    rulesQuery.data?.find((rule) => rule.id === selectedRuleId) ?? null;

  useEffect(() => {
    if (!selectedRule) {
      setEditor(createDefaultRuleEditorState());
      return;
    }

    setEditor(toRuleEditorState(selectedRule));
  }, [selectedRule]);

  const saveRuleMutation = useMutation({
    mutationFn: (payload: {
      mode: "create" | "update";
      ruleId?: string;
      body: {
        name: string;
        ruleType: RuleType;
        expression: RuleExpression;
      };
    }) =>
      payload.mode === "create"
        ? createRule(payload.body)
        : updateRule(payload.ruleId!, payload.body),
    onSuccess: async (rule) => {
      setSelectedRuleId(rule.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "rules"] });
    }
  });

  const updateRuleStatusMutation = useMutation({
    mutationFn: (payload: {
      ruleId: string;
      status: "active" | "inactive";
    }) => updateRule(payload.ruleId, { status: payload.status }),
    onSuccess: async (rule) => {
      setSelectedRuleId(rule.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "rules"] });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => deleteRule(ruleId),
    onSuccess: async () => {
      setSelectedRuleId(NEW_RULE_ID);
      await queryClient.invalidateQueries({ queryKey: ["admin", "rules"] });
    }
  });

  const bindingMutation = useMutation({
    mutationFn: (payload: {
      ruleId: string;
      resourceId: string;
      nextChecked: boolean;
    }) =>
      payload.nextChecked
        ? bindRuleToResource(payload.ruleId, payload.resourceId)
        : unbindRuleFromResource(payload.ruleId, payload.resourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "rules"] });
    }
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
  const isEditorValid =
    editor.name.trim().length > 0 &&
    (editor.ruleType !== "allowed_user_roles" || editor.allowedRoles.length > 0);

  return (
    <PageSection
      title={localeText(locale, "规则工作区", "Rule Workspace")}
      description={localeText(
        locale,
        "在这里创建、编辑、启停和绑定预约规则。规则会直接影响学生的预约可行性，因此所有写操作都带状态反馈。",
        "Create, edit, activate, deactivate, and bind booking rules here. Rules directly affect booking eligibility, so every write action includes visible feedback."
      )}
    >
      {rulesQuery.isLoading || resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入规则工作区", "Loading rule workspace")}
          description={localeText(
            locale,
            "页面正在整理规则定义和资源绑定关系。",
            "Collecting rule definitions and resource bindings."
          )}
        />
      ) : rulesQuery.isError || resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "规则工作区暂时无法加载", "Rule workspace is unavailable")}
          description={
            ((rulesQuery.error ?? resourcesQuery.error) as Error | undefined)?.message ??
            localeText(locale, "未知错误", "Unknown error")
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px,minmax(0,1fr),320px]">
          <div className="grid gap-4">
            <button
              type="button"
              className={`rounded-[24px] border px-5 py-4 text-left transition ${
                selectedRuleId === NEW_RULE_ID
                  ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                  : "border-dashed border-ink/15 bg-white hover:border-moss"
              }`}
              onClick={() => setSelectedRuleId(NEW_RULE_ID)}
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
              {rulesQuery.data?.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  className={`rounded-[24px] border px-5 py-4 text-left transition ${
                    rule.id === selectedRuleId
                      ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                      : "border-ink/10 bg-white hover:border-moss"
                  }`}
                  onClick={() => setSelectedRuleId(rule.id)}
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
                  <p className="mt-3 text-sm text-slate">
                    {describeRuleExpression(rule, locale)}
                  </p>
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

          <div className="grid gap-4">
            <form
              className="rounded-[26px] border border-ink/10 bg-white px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                const body = {
                  name: editor.name.trim(),
                  ruleType: editor.ruleType,
                  expression: buildRuleExpression(editor)
                };

                saveRuleMutation.mutate({
                  mode: selectedRule ? "update" : "create",
                  ruleId: selectedRule?.id,
                  body
                });
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">
                    {selectedRule
                      ? localeText(locale, "编辑规则", "Edit Rule")
                      : localeText(locale, "创建规则", "Create Rule")}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    {selectedRule?.name ??
                      localeText(locale, "新建预约规则", "New Booking Rule")}
                  </h3>
                </div>
                {selectedRule ? (
                  <StatusPill tone={selectedRule.status === "active" ? "success" : "danger"}>
                    {selectedRule.status === "active"
                      ? localeText(locale, "启用中", "Active")
                      : localeText(locale, "已停用", "Inactive")}
                  </StatusPill>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3">
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={editor.name}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder={localeText(locale, "规则名称", "Rule name")}
                />
                <select
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={editor.ruleType}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      ruleType: event.target.value as RuleType
                    }))
                  }
                >
                  <option value="max_duration_minutes">
                    {ruleTypeLabel("max_duration_minutes", locale)}
                  </option>
                  <option value="min_credit_score">
                    {ruleTypeLabel("min_credit_score", locale)}
                  </option>
                  <option value="allowed_user_roles">
                    {ruleTypeLabel("allowed_user_roles", locale)}
                  </option>
                </select>

                {editor.ruleType === "max_duration_minutes" ? (
                  <input
                    type="number"
                    min={1}
                    className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                    value={editor.maxDurationMinutes}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        maxDurationMinutes: Number(event.target.value)
                      }))
                    }
                    placeholder={localeText(
                      locale,
                      "最长预约时长（分钟）",
                      "Maximum duration (minutes)"
                    )}
                  />
                ) : null}

                {editor.ruleType === "min_credit_score" ? (
                  <input
                    type="number"
                    min={0}
                    className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                    value={editor.minCreditScore}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        minCreditScore: Number(event.target.value)
                      }))
                    }
                    placeholder={localeText(
                      locale,
                      "最低信用分",
                      "Minimum credit score"
                    )}
                  />
                ) : null}

                {editor.ruleType === "allowed_user_roles" ? (
                  <div className="grid gap-2">
                    {(["student", "admin"] as const).map((role) => {
                      const checked = editor.allowedRoles.includes(role);

                      return (
                        <label
                          key={role}
                          className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm text-ink"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setEditor((current) => ({
                                ...current,
                                allowedRoles: event.target.checked
                                  ? Array.from(new Set([...current.allowedRoles, role]))
                                  : current.allowedRoles.filter((item) => item !== role)
                              }))
                            }
                          />
                          <span>{roleLabel(role, locale)}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                  disabled={!isEditorValid || saveRuleMutation.isPending}
                >
                  {saveRuleMutation.isPending
                    ? localeText(locale, "保存中", "Saving")
                    : selectedRule
                      ? localeText(locale, "保存修改", "Save Changes")
                      : localeText(locale, "创建规则", "Create Rule")}
                </button>
                {selectedRule ? (
                  <>
                    <button
                      type="button"
                      className="rounded-full border border-moss/25 px-4 py-3 text-sm text-moss transition hover:bg-moss/10 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() =>
                        updateRuleStatusMutation.mutate({
                          ruleId: selectedRule.id,
                          status:
                            selectedRule.status === "active" ? "inactive" : "active"
                        })
                      }
                      disabled={updateRuleStatusMutation.isPending}
                    >
                      {selectedRule.status === "active"
                        ? localeText(locale, "停用规则", "Deactivate Rule")
                        : localeText(locale, "重新启用", "Reactivate Rule")}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-danger/25 px-4 py-3 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        if (
                          !window.confirm(
                            localeText(
                              locale,
                              "只有在规则未绑定任何资源时才允许删除。确认继续吗？",
                              "Rules can only be deleted after all resource bindings are removed. Continue?"
                            )
                          )
                        ) {
                          return;
                        }

                        deleteRuleMutation.mutate(selectedRule.id);
                      }}
                      disabled={deleteRuleMutation.isPending}
                    >
                      {localeText(locale, "删除规则", "Delete Rule")}
                    </button>
                  </>
                ) : null}
              </div>

              <MutationState
                mutation={saveRuleMutation}
                pending={localeText(locale, "正在保存规则。", "Saving rule.")}
                success={localeText(locale, "规则已保存。", "Rule saved.")}
              />
              <MutationState
                mutation={updateRuleStatusMutation}
                pending={localeText(locale, "正在更新规则状态。", "Updating rule status.")}
                success={localeText(locale, "规则状态已更新。", "Rule status updated.")}
              />
              <MutationState
                mutation={deleteRuleMutation}
                pending={localeText(locale, "正在删除规则。", "Deleting rule.")}
                success={localeText(locale, "规则已删除。", "Rule deleted.")}
                formatError={(error) => formatRuleMutationError(error, locale)}
              />
            </form>

            <div className="rounded-[26px] border border-ink/10 bg-white px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {localeText(locale, "资源绑定", "Resource Bindings")}
                  </h3>
                  <p className="mt-2 text-sm text-slate">
                    {selectedRule
                      ? localeText(
                          locale,
                          "勾选后规则会立即作用到对应资源；取消勾选将解绑该资源。",
                          "Checked resources are affected immediately by the selected rule. Unchecking removes the binding."
                        )
                      : localeText(
                          locale,
                          "请先保存规则，再绑定到具体资源。",
                          "Save the rule first before binding it to resources."
                        )}
                  </p>
                </div>
                {selectedRule ? (
                  <StatusPill tone="brand">
                    {localeText(
                      locale,
                      `${selectedRule.resourceIds.length} 个资源`,
                      `${selectedRule.resourceIds.length} resources`
                    )}
                  </StatusPill>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2">
                {resourcesQuery.data?.map((resource) => {
                  const checked = selectedRule?.resourceIds.includes(resource.id) ?? false;

                  return (
                    <label
                      key={resource.id}
                      className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectedRule || bindingMutation.isPending}
                        onChange={(event) => {
                          if (!selectedRule) {
                            return;
                          }

                          if (
                            !event.target.checked &&
                            !window.confirm(
                              localeText(
                                locale,
                                "解绑后该资源将不再受到这条规则限制。确认继续吗？",
                                "This resource will no longer be governed by the rule after unbinding. Continue?"
                              )
                            )
                          ) {
                            return;
                          }

                          bindingMutation.mutate({
                            ruleId: selectedRule.id,
                            resourceId: resource.id,
                            nextChecked: event.target.checked
                          });
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{resource.name}</p>
                        <p className="mt-1 text-xs text-ink/55">
                          {resourceTypeLabel(resource.type, locale)} ·{" "}
                          {resource.status === "active"
                            ? localeText(locale, "启用中", "Active")
                            : localeText(locale, "已停用", "Inactive")}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <MutationState
                mutation={bindingMutation}
                pending={localeText(
                  locale,
                  "正在更新资源绑定。",
                  "Updating resource binding."
                )}
                success={localeText(
                  locale,
                  "规则绑定已更新。",
                  "Rule bindings updated."
                )}
              />
            </div>
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
                    "最长预约时长规则适合直接收口“最多 60 分钟”这类限制。",
                    "Use maximum duration rules to enforce limits such as 60 minutes."
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
        </div>
      )}
    </PageSection>
  );
}

function buildRuleExpression(editor: RuleEditorState): RuleExpression {
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

function toRuleEditorState(rule: AppRule): RuleEditorState {
  return {
    name: rule.name,
    ruleType: rule.ruleType,
    minCreditScore: rule.expression.min ?? 80,
    maxDurationMinutes: rule.expression.max ?? 60,
    allowedRoles: rule.expression.roles ?? ["student"]
  };
}

function describeRuleExpression(rule: AppRule, locale: Locale) {
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

function roleLabel(role: UserRole, locale: Locale) {
  return role === "student"
    ? localeText(locale, "学生", "Student")
    : localeText(locale, "管理员", "Admin");
}

function formatRuleMutationError(error: unknown, locale: Locale) {
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

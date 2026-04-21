import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  bindRuleToResource,
  createRule,
  deleteRule,
  fetchAdminRules,
  unbindRuleFromResource,
  updateRule
} from "../../../../lib/api/rule-api";
import { fetchAdminResources } from "../../../../lib/api/resource-api";
import { getErrorMessage } from "../../../../lib/http/errors";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel } from "../../../user-experience-kit";
import { RulesEditorPanel } from "./rules/rules-editor-panel";
import { RulesSelectorPanel } from "./rules/rules-selector-panel";
import { RulesSummaryPanel } from "./rules/rules-summary-panel";
import {
  buildRuleExpression,
  createDefaultRuleEditorState,
  NEW_RULE_ID,
  toRuleEditorState
} from "./rules/rules-workspace-helpers";

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
  const [editor, setEditor] = useState(createDefaultRuleEditorState);

  useEffect(() => {
    if (selectedRuleId === NEW_RULE_ID) {
      return;
    }

    if (!rulesQuery.data?.some((rule) => rule.id === selectedRuleId)) {
      setSelectedRuleId(rulesQuery.data?.[0]?.id ?? NEW_RULE_ID);
    }
  }, [selectedRuleId, rulesQuery.data]);

  const selectedRule = rulesQuery.data?.find((rule) => rule.id === selectedRuleId) ?? null;

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
        ruleType: typeof editor.ruleType;
        expression: ReturnType<typeof buildRuleExpression>;
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
    mutationFn: (payload: { ruleId: string; status: "active" | "inactive" }) =>
      updateRule(payload.ruleId, { status: payload.status }),
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
    mutationFn: (payload: { ruleId: string; resourceId: string; nextChecked: boolean }) =>
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

  function handleSaveRule() {
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
  }

  function handleToggleRuleStatus() {
    if (!selectedRule) {
      return;
    }

    const nextStatus = selectedRule.status === "active" ? "inactive" : "active";

    if (
      nextStatus === "inactive" &&
      !window.confirm(
        localeText(
          locale,
          "停用后该规则会立即停止影响预约主流程。确认继续吗？",
          "After deactivation, this rule will immediately stop affecting booking flows. Continue?"
        )
      )
    ) {
      return;
    }

    updateRuleStatusMutation.mutate({
      ruleId: selectedRule.id,
      status: nextStatus
    });
  }

  function handleDeleteRule() {
    if (!selectedRule) {
      return;
    }

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
  }

  function handleToggleBinding(resourceId: string, nextChecked: boolean) {
    if (!selectedRule) {
      return;
    }

    if (
      !nextChecked &&
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
      resourceId,
      nextChecked
    });
  }

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
          description={getErrorMessage(rulesQuery.error ?? resourcesQuery.error)}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px,minmax(0,1fr),320px]">
          <RulesSelectorPanel
            locale={locale}
            rules={rulesQuery.data ?? []}
            selectedRuleId={selectedRuleId}
            onSelectRule={setSelectedRuleId}
          />
          <RulesEditorPanel
            locale={locale}
            resources={resourcesQuery.data ?? []}
            selectedRule={selectedRule}
            editor={editor}
            setEditor={setEditor}
            isEditorValid={isEditorValid}
            saveRuleMutation={saveRuleMutation}
            updateRuleStatusMutation={updateRuleStatusMutation}
            deleteRuleMutation={deleteRuleMutation}
            bindingMutation={bindingMutation}
            onSave={handleSaveRule}
            onToggleRuleStatus={handleToggleRuleStatus}
            onDeleteRule={handleDeleteRule}
            onToggleBinding={handleToggleBinding}
          />
          <RulesSummaryPanel locale={locale} ruleStats={ruleStats} />
        </div>
      )}
    </PageSection>
  );
}

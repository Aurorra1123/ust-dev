import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AppRule } from "@campusbook/shared-types";

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
import {
  buildRuleExpression,
  createDefaultRuleEditorState,
  NEW_RULE_ID,
  toRuleEditorState
} from "./rules/rules-workspace-helpers";

type RuleDomain = "academic" | "sports";

export function RulesWorkspace({ locale }: { locale: Locale }) {
  const rulesQuery = useQuery({
    queryKey: ["admin", "rules"],
    queryFn: fetchAdminRules
  });
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const [ruleDomain, setRuleDomain] = useState<RuleDomain>("academic");
  const [selectedRuleId, setSelectedRuleId] = useState(NEW_RULE_ID);
  const [editor, setEditor] = useState(createDefaultRuleEditorState);

  const academicResources = useMemo(
    () =>
      (resourcesQuery.data ?? []).filter((resource) => resource.type === "academic_space"),
    [resourcesQuery.data]
  );
  const sportsResources = useMemo(
    () =>
      (resourcesQuery.data ?? []).filter((resource) => resource.type === "sports_facility"),
    [resourcesQuery.data]
  );
  const academicResourceIds = useMemo(
    () => new Set(academicResources.map((resource) => resource.id)),
    [academicResources]
  );
  const sportsResourceIds = useMemo(
    () => new Set(sportsResources.map((resource) => resource.id)),
    [sportsResources]
  );
  const visibleRules = useMemo(
    () =>
      (rulesQuery.data ?? []).filter((rule) =>
        ruleBelongsToDomain(rule, ruleDomain, academicResourceIds, sportsResourceIds)
      ),
    [academicResourceIds, ruleDomain, rulesQuery.data, sportsResourceIds]
  );
  const currentDomainResources =
    ruleDomain === "academic" ? academicResources : sportsResources;
  const currentDomainResourceIds =
    ruleDomain === "academic" ? academicResourceIds : sportsResourceIds;

  useEffect(() => {
    if (selectedRuleId === NEW_RULE_ID) {
      return;
    }

    if (!visibleRules.some((rule) => rule.id === selectedRuleId)) {
      setSelectedRuleId(visibleRules[0]?.id ?? NEW_RULE_ID);
    }
  }, [selectedRuleId, visibleRules]);

  const selectedRule = visibleRules.find((rule) => rule.id === selectedRuleId) ?? null;

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

  const visibleBindingCount =
    selectedRule?.resourceIds.filter((resourceId) => currentDomainResourceIds.has(resourceId))
      .length ?? 0;
  const hiddenBindingCount =
    selectedRule?.resourceIds.filter((resourceId) => !currentDomainResourceIds.has(resourceId))
      .length ?? 0;
  const isEditorValid =
    editor.name.trim().length > 0 &&
    (editor.ruleType !== "allowed_user_roles" || editor.allowedRoles.length > 0) &&
    (editor.ruleType !== "max_active_reservations_per_category" ||
      editor.maxActiveReservations > 0) &&
    (editor.ruleType !== "no_show_credit_penalty" ||
      (editor.noShowScoreDelta > 0 && editor.noShowBanDays >= 0));

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
      title={localeText(locale, "规则配置", "Rule Config")}
      description={localeText(
        locale,
        "查看并维护预约规则，并将规则绑定到对应资源。",
        "View and maintain booking rules, then bind them to the related resources."
      )}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(["academic", "sports"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-full border px-4 py-2 text-sm transition ${
              ruleDomain === value
                ? "border-ember bg-ember text-white"
                : "border-navy/10 bg-white text-ink hover:border-moss"
            }`}
            onClick={() => setRuleDomain(value)}
          >
            {ruleDomainLabel(value, locale)}
          </button>
        ))}
      </div>

      {rulesQuery.isLoading || resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入规则配置", "Loading rule configuration")}
          description={localeText(
            locale,
            "正在载入规则和资源信息。",
            "Loading rules and resource information."
          )}
        />
      ) : rulesQuery.isError || resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "规则配置暂时无法加载", "Rule configuration is unavailable")}
          description={getErrorMessage(rulesQuery.error ?? resourcesQuery.error)}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px,minmax(0,1fr)]">
          <RulesSelectorPanel
            locale={locale}
            rules={visibleRules}
            selectedRuleId={selectedRuleId}
            onSelectRule={setSelectedRuleId}
          />
          <RulesEditorPanel
            locale={locale}
            resources={currentDomainResources}
            selectedRule={selectedRule}
            editor={editor}
            setEditor={setEditor}
            isEditorValid={isEditorValid}
            bindingScopeLabel={ruleDomainLabel(ruleDomain, locale)}
            visibleBindingCount={visibleBindingCount}
            hiddenBindingCount={hiddenBindingCount}
            saveRuleMutation={saveRuleMutation}
            updateRuleStatusMutation={updateRuleStatusMutation}
            deleteRuleMutation={deleteRuleMutation}
            bindingMutation={bindingMutation}
            onSave={handleSaveRule}
            onToggleRuleStatus={handleToggleRuleStatus}
            onDeleteRule={handleDeleteRule}
            onToggleBinding={handleToggleBinding}
          />
        </div>
      )}
    </PageSection>
  );
}

function ruleDomainLabel(domain: RuleDomain, locale: Locale) {
  return domain === "academic"
    ? localeText(locale, "学术空间规则", "Academic Space Rules")
    : localeText(locale, "体育场馆规则", "Sports Venue Rules");
}

function ruleBelongsToDomain(
  rule: AppRule,
  domain: RuleDomain,
  academicResourceIds: Set<string>,
  sportsResourceIds: Set<string>
) {
  const hasAcademicBinding = rule.resourceIds.some((resourceId) =>
    academicResourceIds.has(resourceId)
  );
  const hasSportsBinding = rule.resourceIds.some((resourceId) =>
    sportsResourceIds.has(resourceId)
  );

  if (!hasAcademicBinding && !hasSportsBinding) {
    return true;
  }

  return domain === "academic" ? hasAcademicBinding : hasSportsBinding;
}

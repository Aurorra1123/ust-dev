import type {
  AdminResourceDetailResponse,
  AppRule,
  RuleType
} from "@campusbook/shared-types";
import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatusPill } from "../../../../user-experience-kit";
import { resourceTypeLabel, ruleTypeLabel } from "../../admin-helpers";
import { MutationState } from "../../components/mutation-state";
import {
  formatRuleMutationError,
  roleLabel,
  type RuleEditorState
} from "./rules-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function RulesEditorPanel({
  locale,
  resources,
  selectedRule,
  editor,
  setEditor,
  isEditorValid,
  bindingScopeLabel,
  visibleBindingCount,
  hiddenBindingCount,
  saveRuleMutation,
  updateRuleStatusMutation,
  deleteRuleMutation,
  bindingMutation,
  onSave,
  onToggleRuleStatus,
  onDeleteRule,
  onToggleBinding
}: {
  locale: Locale;
  resources: AdminResourceDetailResponse[];
  selectedRule: AppRule | null;
  editor: RuleEditorState;
  setEditor: Dispatch<SetStateAction<RuleEditorState>>;
  isEditorValid: boolean;
  bindingScopeLabel: string;
  visibleBindingCount: number;
  hiddenBindingCount: number;
  saveRuleMutation: MutationStateLike;
  updateRuleStatusMutation: MutationStateLike;
  deleteRuleMutation: MutationStateLike;
  bindingMutation: MutationStateLike;
  onSave: () => void;
  onToggleRuleStatus: () => void;
  onDeleteRule: () => void;
  onToggleBinding: (resourceId: string, nextChecked: boolean) => void;
}) {
  return (
    <div className="grid gap-4">
      <form
        className="rounded-[26px] border border-ink/10 bg-white px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
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
              {selectedRule?.name ?? localeText(locale, "新建预约规则", "New Booking Rule")}
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
              placeholder={localeText(locale, "最低信用分", "Minimum credit score")}
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
                onClick={onToggleRuleStatus}
                disabled={updateRuleStatusMutation.isPending}
              >
                {selectedRule.status === "active"
                  ? localeText(locale, "停用规则", "Deactivate Rule")
                  : localeText(locale, "重新启用", "Reactivate Rule")}
              </button>
              <button
                type="button"
                className="rounded-full border border-danger/25 px-4 py-3 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onDeleteRule}
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
                    `当前只展示 ${bindingScopeLabel} 的资源；勾选后规则会立即作用到对应资源，取消勾选会解除绑定。`,
                    `Only ${bindingScopeLabel} resources are listed here. Checking applies the rule immediately, and unchecking removes the binding.`
                  )
                : localeText(
                    locale,
                    "请先保存规则，再绑定到具体资源。",
                    "Save the rule first before binding it to resources."
                  )}
            </p>
            {hiddenBindingCount > 0 ? (
              <p className="mt-2 text-sm text-danger">
                {localeText(
                  locale,
                  `该规则还有 ${hiddenBindingCount} 个其他业务域绑定，请切换到对应子页继续整理。`,
                  `This rule still has ${hiddenBindingCount} bindings in the other domain. Switch tabs to manage them.`
                )}
              </p>
            ) : null}
          </div>
          {selectedRule ? (
            <StatusPill tone="brand">
              {localeText(
                locale,
                `当前域已绑定 ${visibleBindingCount} 个资源`,
                `${visibleBindingCount} bindings in this domain`
              )}
            </StatusPill>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2">
          {resources.length ? (
            resources.map((resource) => {
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
                    onChange={(event) => onToggleBinding(resource.id, event.target.checked)}
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
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-ink/12 px-4 py-4 text-sm text-slate">
              {localeText(
                locale,
                "当前业务域还没有可绑定资源。请先回到资源页创建资源，再回来配置规则。",
                "There are no bindable resources in this domain yet. Create resources first, then return to configure rules."
              )}
            </div>
          )}
        </div>

        <MutationState
          mutation={bindingMutation}
          pending={localeText(locale, "正在更新资源绑定。", "Updating resource binding.")}
          success={localeText(locale, "规则绑定已更新。", "Rule bindings updated.")}
        />
      </div>
    </div>
  );
}

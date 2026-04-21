import type {
  AdminResourceDetailResponse,
  ResourceReleaseFrequency
} from "@campusbook/shared-types";
import type { Dispatch, SetStateAction } from "react";

import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";
import { StatusPill } from "../../../../user-experience-kit";
import { releaseFrequencyLabel, weekDayOptions } from "../../admin-helpers";
import { MutationState } from "../../components/mutation-state";
import type {
  BookingClosureFormState,
  ReleaseRuleFormState,
  ResourceFormState,
  ResourceUnitFormState
} from "./resources-workspace-helpers";

type MutationStateLike = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
};

export function ResourcesActionsPanel({
  locale,
  selectedResource,
  resourceForm,
  setResourceForm,
  resourceUnitForm,
  setResourceUnitForm,
  bookingClosureForm,
  setBookingClosureForm,
  releaseRuleForm,
  setReleaseRuleForm,
  resourceOperationTargetsCount,
  hasReleaseStrategy,
  showSchedulingSettings,
  setShowAdvancedScheduling,
  createResourceMutation,
  createResourceUnitMutation,
  createBookingClosureMutation,
  createReleaseRuleMutation,
  isCreateResourceValid,
  isCreateResourceUnitValid,
  onCreateResource,
  onCreateResourceUnit,
  onCreateBookingClosure,
  onCreateReleaseRule
}: {
  locale: Locale;
  selectedResource: AdminResourceDetailResponse | null;
  resourceForm: ResourceFormState;
  setResourceForm: Dispatch<SetStateAction<ResourceFormState>>;
  resourceUnitForm: ResourceUnitFormState;
  setResourceUnitForm: Dispatch<SetStateAction<ResourceUnitFormState>>;
  bookingClosureForm: BookingClosureFormState;
  setBookingClosureForm: Dispatch<SetStateAction<BookingClosureFormState>>;
  releaseRuleForm: ReleaseRuleFormState;
  setReleaseRuleForm: Dispatch<SetStateAction<ReleaseRuleFormState>>;
  resourceOperationTargetsCount: number;
  hasReleaseStrategy: boolean;
  showSchedulingSettings: boolean;
  setShowAdvancedScheduling: Dispatch<SetStateAction<boolean>>;
  createResourceMutation: MutationStateLike;
  createResourceUnitMutation: MutationStateLike;
  createBookingClosureMutation: MutationStateLike;
  createReleaseRuleMutation: MutationStateLike;
  isCreateResourceValid: boolean;
  isCreateResourceUnitValid: boolean;
  onCreateResource: () => void;
  onCreateResourceUnit: () => void;
  onCreateBookingClosure: () => void;
  onCreateReleaseRule: () => void;
}) {
  return (
    <div className="grid gap-4">
      <form
        className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateResource();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "新增资源", "Create Resource")}
        </h3>
        <div className="mt-4 grid gap-3">
          <select
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.type}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                type: event.target.value as AdminResourceDetailResponse["type"]
              }))
            }
          >
            <option value="academic_space">{localeText(locale, "学术空间", "Study Space")}</option>
            <option value="sports_facility">{localeText(locale, "体育设施", "Sports Facility")}</option>
          </select>
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.code}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                code: event.target.value
              }))
            }
            placeholder={localeText(locale, "资源编码", "Resource code")}
          />
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.name}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                name: event.target.value
              }))
            }
            placeholder={localeText(locale, "资源名称", "Resource name")}
          />
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.location}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                location: event.target.value
              }))
            }
            placeholder={localeText(locale, "位置", "Location")}
          />
          <textarea
            className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceForm.description}
            onChange={(event) =>
              setResourceForm((current) => ({
                ...current,
                description: event.target.value
              }))
            }
            placeholder={localeText(locale, "描述", "Description")}
          />
        </div>
        <MutationState
          mutation={createResourceMutation}
          success={localeText(locale, "资源已创建。", "Resource created.")}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
          disabled={!isCreateResourceValid || createResourceMutation.isPending}
        >
          {createResourceMutation.isPending
            ? localeText(locale, "创建中", "Creating")
            : localeText(locale, "创建资源", "Create Resource")}
        </button>
      </form>

      <form
        className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateResourceUnit();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "新增资源单元", "Create Resource Unit")}
        </h3>
        <p className="mt-2 text-sm text-ink/70">
          {localeText(locale, "当前资源：", "Current resource: ")}
          {selectedResource?.name ||
            localeText(locale, "请先选择左侧资源", "Select a resource from the left")}
        </p>
        <div className="mt-4 grid gap-3">
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceUnitForm.code}
            onChange={(event) =>
              setResourceUnitForm((current) => ({
                ...current,
                code: event.target.value
              }))
            }
            placeholder={localeText(locale, "单元编码", "Unit code")}
          />
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceUnitForm.name}
            onChange={(event) =>
              setResourceUnitForm((current) => ({
                ...current,
                name: event.target.value
              }))
            }
            placeholder={localeText(locale, "单元名称", "Unit name")}
          />
          <input
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={resourceUnitForm.unitType}
            onChange={(event) =>
              setResourceUnitForm((current) => ({
                ...current,
                unitType: event.target.value
              }))
            }
            placeholder={localeText(locale, "单元类型", "Unit type")}
          />
        </div>
        <MutationState
          mutation={createResourceUnitMutation}
          success={localeText(locale, "资源单元已创建。", "Resource unit created.")}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
          disabled={!isCreateResourceUnitValid || createResourceUnitMutation.isPending}
        >
          {createResourceUnitMutation.isPending
            ? localeText(locale, "创建中", "Creating")
            : localeText(locale, "创建资源单元", "Create Resource Unit")}
        </button>
      </form>

      <form
        className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateBookingClosure();
        }}
      >
        <h3 className="text-lg font-semibold text-ink">
          {localeText(locale, "新增预约关闭规则", "Create booking closure")}
        </h3>
        <p className="mt-2 text-sm text-ink/70">
          {localeText(
            locale,
            "支持按时间段关闭预约，也支持从当前时间开始长期关闭。",
            "Close booking for a time range, or close the channel indefinitely from now."
          )}
        </p>
        <div className="mt-4 grid gap-3">
          <input
            type="datetime-local"
            className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={bookingClosureForm.startsAt}
            onChange={(event) =>
              setBookingClosureForm((current) => ({
                ...current,
                startsAt: event.target.value
              }))
            }
          />
          {!bookingClosureForm.indefinite ? (
            <input
              type="datetime-local"
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={bookingClosureForm.endsAt}
              onChange={(event) =>
                setBookingClosureForm((current) => ({
                  ...current,
                  endsAt: event.target.value
                }))
              }
            />
          ) : null}
          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={bookingClosureForm.indefinite}
              onChange={(event) =>
                setBookingClosureForm((current) => ({
                  ...current,
                  indefinite: event.target.checked
                }))
              }
            />
            <span>{localeText(locale, "从当前时间开始长期关闭", "Close indefinitely from start time")}</span>
          </label>
          <textarea
            className="min-h-[88px] rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={bookingClosureForm.reason}
            onChange={(event) =>
              setBookingClosureForm((current) => ({
                ...current,
                reason: event.target.value
              }))
            }
            placeholder={localeText(locale, "关闭原因", "Closure reason")}
          />
        </div>
        <MutationState
          mutation={createBookingClosureMutation}
          success={localeText(locale, "预约关闭规则已保存。", "Booking closure saved.")}
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-danger px-5 py-3 text-sm font-medium text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:bg-danger/50"
          disabled={!resourceOperationTargetsCount || createBookingClosureMutation.isPending}
        >
          {createBookingClosureMutation.isPending
            ? localeText(locale, "保存中", "Saving")
            : localeText(locale, "保存关闭规则", "Save booking closure")}
        </button>
      </form>

      {showSchedulingSettings ? (
        <form
          className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateReleaseRule();
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink">
                {localeText(locale, "高级调度设置", "Advanced Scheduling")}
              </h3>
              <p className="mt-2 text-sm text-ink/70">
                {localeText(
                  locale,
                  "只有资源需要延迟开放时，才建议配置预约开放策略。",
                  "Only configure an opening strategy when bookings should open on a delayed schedule."
                )}
              </p>
            </div>
            {hasReleaseStrategy ? (
              <StatusPill tone="brand">
                {localeText(
                  locale,
                  `${selectedResource?.releaseRules.length ?? 0} 条策略`,
                  `${selectedResource?.releaseRules.length ?? 0} strategies`
                )}
              </StatusPill>
            ) : (
              <button
                type="button"
                className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
                onClick={() => setShowAdvancedScheduling(false)}
              >
                {localeText(locale, "收起高级设置", "Hide Advanced Settings")}
              </button>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-navy/10 bg-sand px-4 py-4">
            <p className="text-sm font-medium text-ink">
              {localeText(locale, "预约开放策略", "Opening Strategy")}
            </p>
            <p className="mt-2 text-sm text-slate">
              {localeText(
                locale,
                "如果某类资源需要到每天、每周或每月的固定时刻才开放预约，可以在这里设置；没有这类需求时，保持默认开放即可。",
                "Use this only when a resource should open for booking at a fixed daily, weekly, or monthly time. Otherwise, keep the default open behavior."
              )}
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            <select
              className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
              value={releaseRuleForm.frequency}
              onChange={(event) =>
                setReleaseRuleForm((current) => ({
                  ...current,
                  frequency: event.target.value as ResourceReleaseFrequency
                }))
              }
            >
              <option value="daily">{releaseFrequencyLabel("daily", locale)}</option>
              <option value="weekly">{releaseFrequencyLabel("weekly", locale)}</option>
              <option value="monthly">{releaseFrequencyLabel("monthly", locale)}</option>
            </select>

            {releaseRuleForm.frequency === "weekly" ? (
              <select
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={releaseRuleForm.dayOfWeek}
                onChange={(event) =>
                  setReleaseRuleForm((current) => ({
                    ...current,
                    dayOfWeek: Number(event.target.value)
                  }))
                }
              >
                {weekDayOptions(locale).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

            {releaseRuleForm.frequency === "monthly" ? (
              <input
                type="number"
                min={1}
                max={31}
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={releaseRuleForm.dayOfMonth}
                onChange={(event) =>
                  setReleaseRuleForm((current) => ({
                    ...current,
                    dayOfMonth: Number(event.target.value)
                  }))
                }
                placeholder={localeText(locale, "每月开放日期", "Day of month")}
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={0}
                max={23}
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={releaseRuleForm.hour}
                onChange={(event) =>
                  setReleaseRuleForm((current) => ({
                    ...current,
                    hour: Number(event.target.value)
                  }))
                }
                placeholder={localeText(locale, "开放小时", "Open hour")}
              />
              <input
                type="number"
                min={0}
                max={59}
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={releaseRuleForm.minute}
                onChange={(event) =>
                  setReleaseRuleForm((current) => ({
                    ...current,
                    minute: Number(event.target.value)
                  }))
                }
                placeholder={localeText(locale, "开放分钟", "Open minute")}
              />
            </div>
          </div>

          <MutationState
            mutation={createReleaseRuleMutation}
            success={localeText(locale, "预约开放策略已保存。", "Opening strategy saved.")}
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-navy/50"
            disabled={!resourceOperationTargetsCount || createReleaseRuleMutation.isPending}
          >
            {createReleaseRuleMutation.isPending
              ? localeText(locale, "保存中", "Saving")
              : localeText(locale, "保存开放策略", "Save Opening Strategy")}
          </button>
        </form>
      ) : (
        <div className="rounded-[24px] border border-dashed border-ink/15 bg-white px-5 py-5">
          <h3 className="text-lg font-semibold text-ink">
            {localeText(locale, "高级调度设置", "Advanced Scheduling")}
          </h3>
          <p className="mt-2 text-sm text-slate">
            {localeText(
              locale,
              "默认演示路径不要求配置预约开放策略。只有资源需要延迟开放时，再展开这部分设置。",
              "The default demo flow does not require an opening strategy. Expand this section only when bookings should open later."
            )}
          </p>
          <button
            type="button"
            className="mt-4 rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
            onClick={() => setShowAdvancedScheduling(true)}
          >
            {localeText(locale, "展开高级调度设置", "Show Advanced Scheduling")}
          </button>
        </div>
      )}
    </div>
  );
}

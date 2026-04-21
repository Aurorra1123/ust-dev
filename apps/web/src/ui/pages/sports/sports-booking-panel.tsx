import type { ResourceDetailResponse } from "@campusbook/shared-types";

import { ApiError } from "../../../lib/http/errors";
import { formatDateTime } from "../../../lib/date";
import { localeText } from "../../../lib/locale";
import type { SessionStatus } from "../../../store/session-store";
import { StatePanel } from "../../user-experience-kit";
import {
  formatNameList,
  legendToneClass,
  type CellState
} from "./sports-helpers";

type BookingTarget = {
  id: string;
  label: string;
  detail: string;
};

export function SportsBookingPanel({
  locale,
  sessionStatus,
  mode,
  hasGroupedBooking,
  availableTargets,
  targetId,
  slotStarts,
  selectedGroup,
  selectedGroupMemberNames,
  companionEmailsText,
  isPending,
  error,
  onModeChange,
  onTargetChange,
  onToggleSlot,
  onCompanionEmailsChange,
  onSubmit
}: {
  locale: "zh-CN" | "en";
  sessionStatus: SessionStatus;
  mode: "unit" | "group";
  hasGroupedBooking: boolean;
  availableTargets: BookingTarget[];
  targetId: string;
  slotStarts: string[];
  selectedGroup: ResourceDetailResponse["groups"][number] | null;
  selectedGroupMemberNames: string[];
  companionEmailsText: string;
  isPending: boolean;
  error: Error | null;
  onModeChange: (mode: "unit" | "group") => void;
  onTargetChange: (targetId: string) => void;
  onToggleSlot: (slotStartIso: string) => void;
  onCompanionEmailsChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="grid gap-4 rounded-[24px] border border-ink/10 bg-white px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm transition ${
            mode === "unit" ? "bg-ember text-white" : "bg-sand text-ink"
          }`}
          onClick={() => onModeChange("unit")}
        >
          {localeText(locale, "单场地", "Single Court")}
        </button>
        {hasGroupedBooking ? (
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "group" ? "bg-ember text-white" : "bg-sand text-ink"
            }`}
            onClick={() => onModeChange("group")}
          >
            {localeText(locale, "组合预订", "Grouped Booking")}
          </button>
        ) : null}
      </div>
      {hasGroupedBooking ? (
        <p className="text-sm text-slate">
          {mode === "group"
            ? localeText(
                locale,
                "当前按整组场地一起预订，提交后会同时锁定所有成员场地。",
                "This mode books the full court set together. Submitting will lock every included court."
              )
            : localeText(
                locale,
                "只有当你需要同时占用一组关联场地时，再切到组合预订。",
                "Switch to grouped booking only when you need to reserve a linked set of courts together."
              )}
        </p>
      ) : null}

      <label className="grid gap-2 text-sm text-ink/75">
        {localeText(locale, "目标", "Target")}
        <select
          className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          value={targetId}
          onChange={(event) => onTargetChange(event.target.value)}
        >
          {availableTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label} · {target.detail}
            </option>
          ))}
        </select>
      </label>

      {mode === "group" && selectedGroup ? (
        <div className="rounded-[22px] border border-ember/15 bg-[#fff7ef] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
            {localeText(locale, "组合说明", "Grouped Booking")}
          </p>
          <p className="mt-3 text-sm font-semibold text-ink">{selectedGroup.name}</p>
          <p className="mt-2 text-sm text-slate">
            {selectedGroup.description ||
              localeText(
                locale,
                "该组合用于一次性锁定一组关联场地。",
                "This set is used to reserve multiple linked courts in one booking."
              )}
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                {localeText(locale, "成员场地", "Included Courts")}
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                {formatNameList(selectedGroupMemberNames, locale)}
              </p>
            </div>
            <p>
              {localeText(
                locale,
                "选择一个时段会同时占用整组场地；只要其中任一成员场地已占用、进行中或关闭，该时段就不能选。",
                "Selecting one slot reserves the entire set. If any included court is occupied, in progress, or closed, that slot cannot be chosen."
              )}
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
          {localeText(locale, "已选时段", "Selected Slots")}
        </p>
        {slotStarts.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {slotStarts.map((slotStartIso) => (
              <button
                key={slotStartIso}
                type="button"
                className="rounded-full bg-ember/10 px-3 py-2 text-xs text-ember"
                onClick={() => onToggleSlot(slotStartIso)}
              >
                {formatDateTime(slotStartIso)}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate">
            {localeText(locale, "请在时间表中选择时段。", "Select time slots from the table.")}
          </p>
        )}
      </div>

      {mode === "group" && selectedGroup ? (
        <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
            {localeText(locale, "提交效果", "Booking Effect")}
          </p>
          <p className="mt-3 text-sm text-slate">
            {localeText(
              locale,
              `提交后会同时预约 ${formatNameList(selectedGroupMemberNames, locale)}。`,
              `Submitting will reserve ${formatNameList(selectedGroupMemberNames, locale)} together.`
            )}
          </p>
        </div>
      ) : null}

      <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
          {localeText(locale, "状态说明", "Legend")}
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate">
          <SportsLegendItem label={localeText(locale, "可预约", "Available")} tone="available" />
          <SportsLegendItem label={localeText(locale, "已占用", "Occupied")} tone="occupied" />
          <SportsLegendItem
            label={localeText(locale, "进行中", "In Progress")}
            tone="in_progress"
          />
          <SportsLegendItem
            label={localeText(locale, "已选中", "Selected")}
            tone="selected"
          />
          <SportsLegendItem label={localeText(locale, "不可约", "Closed")} tone="closed" />
        </div>
      </div>

      <label className="grid gap-2 text-sm text-ink/75">
        {localeText(locale, "同行人邮箱", "Companion Emails")}
        <textarea
          className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          value={companionEmailsText}
          onChange={(event) => onCompanionEmailsChange(event.target.value)}
        />
      </label>

      {error ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "预约未提交成功", "Booking failed")}
          description={(error as ApiError).message}
        />
      ) : null}

      <button
        type="submit"
        className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
        disabled={
          sessionStatus !== "authenticated" ||
          !targetId ||
          slotStarts.length === 0 ||
          isPending
        }
      >
        {sessionStatus === "authenticated"
          ? isPending
            ? localeText(locale, "提交中", "Submitting")
            : localeText(locale, "提交预约", "Submit Booking")
          : localeText(locale, "请先登录后预约", "Sign in before booking")}
      </button>
    </form>
  );
}

function SportsLegendItem({
  label,
  tone
}: {
  label: string;
  tone: CellState;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-4 w-4 rounded-full ${legendToneClass(tone)}`} />
      <span>{label}</span>
    </div>
  );
}

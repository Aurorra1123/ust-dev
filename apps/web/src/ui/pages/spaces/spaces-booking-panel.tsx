import type {
  AppResourceUnit,
  PublicResourceReservationRecord,
  PublicResourceReservationStatusResponse
} from "@campusbook/shared-types";

import { formatDateTime } from "../../../lib/date";
import { getErrorMessage } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import type { SessionStatus } from "../../../store/session-store";
import { StatePanel } from "../../user-experience-kit";
import {
  rangeIntersectsWindow,
  type SelectedRange,
  type SelectionConflict
} from "./spaces-helpers";
import { SpacesLegendItem } from "./spaces-availability-panel";

export function SpacesBookingPanel({
  locale,
  sessionStatus,
  selectedResourceName,
  selectedUnit,
  startTime,
  endTime,
  selectedRange,
  selectionConflict,
  displayStart,
  displayEnd,
  schedule,
  isScheduleLoading,
  isScheduleError,
  selectedUnitReservations,
  companionEmailsText,
  isPending,
  error,
  onStartTimeChange,
  onEndTimeChange,
  onCompanionEmailsChange,
  onAlignToSelection,
  onSubmit
}: {
  locale: Locale;
  sessionStatus: SessionStatus;
  selectedResourceName: string | null;
  selectedUnit: AppResourceUnit | null;
  startTime: string;
  endTime: string;
  selectedRange: SelectedRange | null;
  selectionConflict: SelectionConflict;
  displayStart: Date;
  displayEnd: Date;
  schedule: PublicResourceReservationStatusResponse | undefined;
  isScheduleLoading: boolean;
  isScheduleError: boolean;
  selectedUnitReservations: PublicResourceReservationRecord[];
  companionEmailsText: string;
  isPending: boolean;
  error: Error | null;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onCompanionEmailsChange: (value: string) => void;
  onAlignToSelection: () => void;
  onSubmit: () => void;
}) {
  const shouldAlignSelection =
    selectedRange && !rangeIntersectsWindow(selectedRange, displayStart, displayEnd);
  const hasValidationError =
    !selectedRange || selectionConflict?.tone === "danger" || Boolean(error);
  const validationMessageId = "spaces-booking-validation-message";

  return (
    <form
      className="grid gap-4 rounded-[24px] border border-navy/10 bg-white px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h3 className="text-xl font-semibold text-ink">
        {selectedUnit
          ? `${selectedResourceName ?? ""} · ${selectedUnit.name}`
          : localeText(locale, "请选择资源单元", "Select a unit")}
      </h3>

      <label className="grid gap-2 text-sm text-ink/75">
        {localeText(locale, "开始时间", "Start Time")}
        <input
          id="spaces-start-time"
          className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          type="datetime-local"
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
          aria-invalid={hasValidationError}
          aria-describedby="spaces-booking-time-help spaces-booking-validation-message"
        />
      </label>

      <label className="grid gap-2 text-sm text-ink/75">
        {localeText(locale, "结束时间", "End Time")}
        <input
          id="spaces-end-time"
          className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          type="datetime-local"
          value={endTime}
          onChange={(event) => onEndTimeChange(event.target.value)}
          aria-invalid={hasValidationError}
          aria-describedby="spaces-booking-time-help spaces-booking-validation-message"
        />
      </label>

      <p id="spaces-booking-time-help" className="text-xs leading-6 text-slate">
        {localeText(
          locale,
          "时间输入框支持键盘直接录入，结束时间必须晚于开始时间；若当前视图没有覆盖所选时段，可使用下方按钮对齐。",
          "Use the keyboard to enter time directly. The end time must be later than the start time. If the current timeline window does not cover your selection, align it with the button below."
        )}
      </p>

      {!selectedRange ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "请输入有效时间范围", "Enter a valid time range")}
          description={localeText(
            locale,
            "结束时间必须晚于开始时间。",
            "The end time must be later than the start time."
          )}
        />
      ) : selectionConflict ? (
        <div id={validationMessageId}>
          <StatePanel
            tone={selectionConflict.tone}
            title={selectionConflict.title}
            description={selectionConflict.description}
          />
        </div>
      ) : null}

      {shouldAlignSelection ? (
        <button
          type="button"
          className="rounded-full border border-navy/10 px-4 py-3 text-sm text-ink transition hover:border-moss"
          onClick={onAlignToSelection}
        >
          {localeText(locale, "将时间视图对齐到所选时段", "Align timeline to selection")}
        </button>
      ) : null}

      <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
          {localeText(locale, "状态说明", "Legend")}
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate">
          <SpacesLegendItem
            label={localeText(locale, "可预约区间", "Available")}
            tone="available"
          />
          <SpacesLegendItem
            label={localeText(locale, "已占用区间", "Occupied")}
            tone="occupied"
          />
          <SpacesLegendItem
            label={localeText(locale, "当前进行中", "In Progress")}
            tone="current"
          />
          <SpacesLegendItem
            label={localeText(locale, "关闭区间", "Closed")}
            tone="closed"
          />
          <SpacesLegendItem
            label={localeText(locale, "当前选择", "Selection")}
            tone="selection"
          />
        </div>
      </div>

      <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
          {localeText(locale, "当前单元已占用", "Occupied Periods")}
        </p>
        {selectedUnitReservations.length ? (
          <div className="mt-3 grid gap-2">
            {selectedUnitReservations.slice(0, 5).map((reservation) => (
              <div
                key={`${reservation.orderId}-${reservation.startTime}`}
                className="rounded-2xl bg-white px-4 py-3 text-sm text-slate"
              >
                {formatDateTime(reservation.startTime)} {" → "}{" "}
                {formatDateTime(reservation.endTime)}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate">
            {localeText(
              locale,
              "当前时间窗内没有已占用记录。",
              "No occupied periods in the current window."
            )}
          </p>
        )}
      </div>

      <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
          {localeText(locale, "资源关闭区间", "Resource Closures")}
        </p>
        {schedule?.closures.length ? (
          <div className="mt-3 grid gap-2">
            {schedule.closures.slice(0, 4).map((closure) => (
              <div
                key={`${closure.startsAt}-${closure.endsAt ?? "open"}`}
                className="rounded-2xl bg-white px-4 py-3 text-sm text-slate"
              >
                <p>
                  {formatDateTime(closure.startsAt)} {" → "}{" "}
                  {closure.endsAt
                    ? formatDateTime(closure.endsAt)
                    : localeText(locale, "长期关闭", "Open-ended")}
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  {closure.reason ||
                    localeText(locale, "未填写关闭原因", "No closure reason recorded")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate">
            {localeText(
              locale,
              "当前时间窗内没有关闭区间。",
              "No closure periods in the current window."
            )}
          </p>
        )}
      </div>

      <label className="grid gap-2 text-sm text-ink/75">
        {localeText(locale, "同行人邮箱", "Companion Emails")}
        <textarea
          id="spaces-companion-emails"
          className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
          value={companionEmailsText}
          onChange={(event) => onCompanionEmailsChange(event.target.value)}
          aria-describedby="spaces-companion-help"
        />
      </label>
      <p id="spaces-companion-help" className="text-xs leading-6 text-slate">
        {localeText(
          locale,
          "可选。输入多个邮箱时可使用逗号、空格或换行分隔。",
          "Optional. Separate multiple emails with commas, spaces, or line breaks."
        )}
      </p>

      {error ? (
        <div id={validationMessageId}>
          <StatePanel
            tone="danger"
            title={localeText(locale, "预约未提交成功", "Booking failed")}
            description={getErrorMessage(error)}
          />
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
        disabled={
          sessionStatus !== "authenticated" ||
          isScheduleLoading ||
          isScheduleError ||
          !selectedUnit ||
          !selectedRange ||
          selectionConflict?.tone === "danger" ||
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

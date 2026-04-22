import type {
  AppResourceUnit,
  PublicResourceReservationRecord,
  PublicResourceReservationStatusResponse
} from "@campusbook/shared-types";

import { getErrorMessage } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import type { SessionStatus } from "../../../store/session-store";
import { CompanionEmailsField } from "../booking/companion-emails-field";
import { StatePanel } from "../../user-experience-kit";
import {
  rangeIntersectsWindow,
  type SelectedRange,
  type SelectionConflict
} from "./spaces-helpers";
import { OccupiedPeriodsCard } from "./occupied-periods-card";
import { ResourceClosuresCard } from "./resource-closures-card";
import { SpaceLegendCard } from "./space-legend-card";
import { SpaceTimeRangeFields } from "./space-time-range-fields";
import { SpaceValidationPanel } from "./space-validation-panel";

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

      <SpaceTimeRangeFields
        locale={locale}
        startTime={startTime}
        endTime={endTime}
        hasValidationError={hasValidationError}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
      />

      <SpaceValidationPanel
        locale={locale}
        selectedRange={selectedRange}
        selectionConflict={selectionConflict}
      />

      {shouldAlignSelection ? (
        <button
          type="button"
          className="rounded-full border border-navy/10 px-4 py-3 text-sm text-ink transition hover:border-moss"
          onClick={onAlignToSelection}
        >
          {localeText(locale, "将时间视图对齐到所选时段", "Align timeline to selection")}
        </button>
      ) : null}

      <SpaceLegendCard locale={locale} />

      <OccupiedPeriodsCard locale={locale} reservations={selectedUnitReservations} />

      <ResourceClosuresCard locale={locale} schedule={schedule} />

      <CompanionEmailsField
        locale={locale}
        idPrefix="spaces"
        value={companionEmailsText}
        onChange={onCompanionEmailsChange}
      />

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

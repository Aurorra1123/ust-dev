import type { ResourceDetailResponse } from "@campusbook/shared-types";

import { getErrorMessage } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import type { SessionStatus } from "../../../store/session-store";
import { CompanionEmailsField } from "../booking/companion-emails-field";
import { StatePanel } from "../../user-experience-kit";
import { GroupedBookingNotice } from "./grouped-booking-notice";
import { SelectedSlotsCard } from "./selected-slots-card";
import { SportsBookingModeSwitch } from "./sports-booking-mode-switch";
import { SportsLegendCard } from "./sports-legend-card";
import { SportsTargetSelect, type BookingTarget } from "./sports-target-select";

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
      <SportsBookingModeSwitch
        locale={locale}
        mode={mode}
        hasGroupedBooking={hasGroupedBooking}
        onModeChange={onModeChange}
      />

      <SportsTargetSelect
        locale={locale}
        targetId={targetId}
        availableTargets={availableTargets}
        onTargetChange={onTargetChange}
      />

      {mode === "group" ? (
        <GroupedBookingNotice
          locale={locale}
          selectedGroup={selectedGroup}
          selectedGroupMemberNames={selectedGroupMemberNames}
        />
      ) : null}

      <SelectedSlotsCard
        locale={locale}
        slotStarts={slotStarts}
        onToggleSlot={onToggleSlot}
        selectedGroupMemberNames={selectedGroupMemberNames}
        showGroupEffect={mode === "group" && Boolean(selectedGroup)}
      />

      <SportsLegendCard locale={locale} />

      <CompanionEmailsField
        locale={locale}
        idPrefix="sports"
        value={companionEmailsText}
        onChange={onCompanionEmailsChange}
      />

      {error ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "预约未提交成功", "Booking failed")}
          description={getErrorMessage(error)}
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

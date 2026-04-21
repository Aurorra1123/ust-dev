import { Fragment } from "react";
import type {
  PublicResourceReservationStatusResponse,
  ResourceDetailResponse
} from "@campusbook/shared-types";

import { addHours, formatDate, formatTime } from "../../../lib/date";
import { getErrorMessage } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import { StatePanel } from "../../user-experience-kit";
import {
  cellStateClass,
  cellStateLabel,
  getGroupSlotState,
  getSlotState,
  headerStateClass,
  headerStateLabel
} from "./sports-helpers";

export function SportsSchedulePanel({
  locale,
  currentResource,
  displayStart,
  slotMoments,
  schedule,
  isLoading,
  isError,
  error,
  currentHourStart,
  bookingThreshold,
  mode,
  targetId,
  slotStarts,
  selectedGroup,
  selectedGroupUnitIds,
  onMovePrevious,
  onMoveNext,
  onToggleSlot,
  onSelectUnit
}: {
  locale: "zh-CN" | "en";
  currentResource: ResourceDetailResponse | null;
  displayStart: Date;
  slotMoments: Date[];
  schedule: PublicResourceReservationStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  currentHourStart: Date;
  bookingThreshold: Date;
  mode: "unit" | "group";
  targetId: string;
  slotStarts: string[];
  selectedGroup: ResourceDetailResponse["groups"][number] | null;
  selectedGroupUnitIds: Set<string>;
  onMovePrevious: () => void;
  onMoveNext: () => void;
  onToggleSlot: (slotStartIso: string) => void;
  onSelectUnit: (unitId: string, slotStartIso: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{formatDate(displayStart.toISOString())}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onMovePrevious}
            disabled={displayStart.getTime() <= currentHourStart.getTime()}
          >
            {localeText(locale, "上一段", "Previous")}
          </button>
          <button
            type="button"
            className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
            onClick={onMoveNext}
          >
            {localeText(locale, "下一段", "Next")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4">
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入时段状态", "Loading schedule")}
            description={localeText(locale, "请稍候。", "Please wait.")}
          />
        </div>
      ) : isError ? (
        <div className="mt-4">
          <StatePanel
            tone="danger"
            title={localeText(locale, "时段状态暂时无法加载", "Schedule is unavailable")}
            description={getErrorMessage(error, "")}
          />
        </div>
      ) : currentResource ? (
        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[860px] gap-2"
            style={{
              gridTemplateColumns: `160px repeat(${slotMoments.length}, minmax(88px, 1fr))`
            }}
          >
            <div className="rounded-2xl bg-sand px-4 py-4 text-sm font-medium text-ink">
              {localeText(locale, "场地 / 时间", "Court / Time")}
            </div>
            {slotMoments.map((slot) => {
              const slotIso = slot.toISOString();
              const groupState = getGroupSlotState({
                currentResource,
                selectedGroupId: selectedGroup?.id ?? null,
                selectedGroupUnitIds,
                slotStart: slot,
                schedule,
                bookingThreshold,
                mode,
                targetId,
                slotStarts
              });

              return (
                <div key={slotIso} className="rounded-2xl bg-sand px-3 py-3 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                    {formatTime(slotIso)}
                  </p>
                  {mode === "group" ? (
                    <button
                      type="button"
                      className={`mt-2 w-full rounded-xl px-2 py-2 text-xs font-medium transition ${headerStateClass(
                        groupState
                      )}`}
                      disabled={groupState !== "available" && groupState !== "selected"}
                      onClick={() => onToggleSlot(slotIso)}
                    >
                      {headerStateLabel(groupState, locale)}
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-ink/60">
                      {formatTime(addHours(slot, 1).toISOString())}
                    </p>
                  )}
                </div>
              );
            })}

            {currentResource.units.map((unit) => (
              <Fragment key={unit.id}>
                <div
                  className={`rounded-2xl border px-4 py-4 ${
                    mode === "group" && selectedGroupUnitIds.has(unit.id)
                      ? "border-ember/25 bg-ember/10"
                      : targetId === unit.id
                        ? "border-moss/25 bg-mist"
                        : "border-ink/10 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{unit.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">
                    {unit.code}
                  </p>
                </div>

                {slotMoments.map((slot) => {
                  const slotIso = slot.toISOString();
                  const state = getSlotState({
                    schedule,
                    resourceUnitId: unit.id,
                    slotStart: slot,
                    bookingThreshold,
                    mode,
                    targetId,
                    slotStarts
                  });

                  return (
                    <button
                      key={`${unit.id}-${slotIso}`}
                      type="button"
                      className={`min-h-[82px] rounded-2xl border px-3 py-3 text-left transition ${cellStateClass(
                        state
                      )}`}
                      disabled={mode !== "unit" || (state !== "available" && state !== "selected")}
                      onClick={() => onSelectUnit(unit.id, slotIso)}
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-ink/45">
                        {formatTime(slotIso)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-ink">
                        {cellStateLabel(state, locale)}
                      </p>
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import type {
  PublicResourceReservationStatusResponse,
  ResourceListItem
} from "@campusbook/shared-types";

import { formatDate, formatTime } from "../../../lib/date";
import { getErrorMessage } from "../../../lib/http/errors";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";
import { StatePanel } from "../../user-experience-kit";
import {
  buildTimelineSegments,
  calculateLeftPercent,
  isNowVisible,
  legendToneClass,
  summarizeUnitWindow,
  timelineSegmentClass,
  type SelectedRange,
  type TimelineSegmentTone
} from "./spaces-helpers";

export function SpacesAvailabilityPanel({
  locale,
  selectedResource,
  selectedUnitId,
  displayStart,
  displayEnd,
  timelineMarkers,
  schedule,
  isLoading,
  isError,
  error,
  selectedRange,
  onMovePrevious,
  onMoveCurrent,
  onMoveNext,
  onSelectUnit
}: {
  locale: Locale;
  selectedResource: ResourceListItem | null;
  selectedUnitId: string;
  displayStart: Date;
  displayEnd: Date;
  timelineMarkers: Date[];
  schedule: PublicResourceReservationStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  selectedRange: SelectedRange | null;
  onMovePrevious: () => void;
  onMoveCurrent: () => void;
  onMoveNext: () => void;
  onSelectUnit: (unitId: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-ink">
            {selectedResource?.name ?? localeText(locale, "请选择资源", "Select a resource")}
          </h3>
          <p className="mt-2 text-sm text-slate">
            {selectedResource
              ? localeText(
                  locale,
                  "每条时间轴代表一个资源单元。灰色表示关闭，金色表示已占用，蓝色表示当前正在使用。",
                  "Each timeline represents a unit. Grey means closed, gold means occupied, and blue indicates an in-progress reservation."
                )
              : localeText(locale, "请先选择左侧资源。", "Pick a resource first.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
            onClick={onMovePrevious}
          >
            {localeText(locale, "上一段", "Previous")}
          </button>
          <button
            type="button"
            className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
            onClick={onMoveCurrent}
          >
            {localeText(locale, "回到当前", "Back to Now")}
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
        <div className="mt-5">
          <StatePanel
            tone="loading"
            title={localeText(locale, "正在载入可用时间视图", "Loading availability")}
            description={localeText(locale, "请稍候。", "Please wait.")}
          />
        </div>
      ) : isError ? (
        <div className="mt-5">
          <StatePanel
            tone="danger"
            title={localeText(locale, "可用时间视图暂时无法加载", "Availability is unavailable")}
            description={getErrorMessage(error, "")}
          />
        </div>
      ) : selectedResource ? (
        <div className="mt-5 grid gap-4">
          {schedule?.channelStatus.status !== "open" ? (
            <StatePanel
              tone="danger"
              title={localeText(
                locale,
                "当前资源预约通道不是开放状态",
                "Booking channel is not open"
              )}
              description={
                schedule?.channelStatus.activeClosureReason ||
                localeText(
                  locale,
                  "当前资源存在关闭或待开放状态，请结合时间视图判断是否需要改期。",
                  "This resource is currently closed or not yet open. Use the timeline to decide whether to choose another time."
                )
              }
            />
          ) : null}

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="ml-[188px] flex items-end justify-between gap-2 px-2">
                {timelineMarkers.map((marker, index) => (
                  <div key={marker.toISOString()} className="text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-ink/45">
                      {index === 0
                        ? formatDate(marker.toISOString())
                        : formatTime(marker.toISOString())}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                {selectedResource.units.map((unit) => {
                  const reservationSegments =
                    schedule?.academicReservations.filter(
                      (reservation) => reservation.resourceUnitId === unit.id
                    ) ?? [];
                  const segments = buildTimelineSegments({
                    displayStart,
                    displayEnd,
                    unitName: unit.name,
                    reservations: reservationSegments,
                    closures: schedule?.closures ?? [],
                    selectedRange: unit.id === selectedUnitId ? selectedRange : null
                  });
                  const rowSummary = summarizeUnitWindow(
                    reservationSegments.length,
                    schedule?.closures.length ?? 0,
                    locale
                  );

                  return (
                    <button
                      key={unit.id}
                      type="button"
                      className={`flex min-w-[780px] items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                        unit.id === selectedUnitId
                          ? "border-ember bg-ember/10"
                          : "border-ink/10 bg-sand hover:border-moss"
                      }`}
                      onClick={() => onSelectUnit(unit.id)}
                    >
                      <div className="w-40 shrink-0">
                        <p className="text-sm font-semibold text-ink">{unit.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">
                          {unit.code}
                        </p>
                        <p className="mt-2 text-xs text-slate">{rowSummary}</p>
                      </div>

                      <div className="relative h-16 flex-1 rounded-2xl border border-navy/10 bg-white">
                        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-navy/10" />

                        {timelineMarkers.slice(1, -1).map((marker) => (
                          <div
                            key={marker.toISOString()}
                            className="absolute inset-y-0 w-px bg-navy/8"
                            style={{
                              left: `${calculateLeftPercent(
                                marker.getTime(),
                                displayStart.getTime(),
                                displayEnd.getTime()
                              )}%`
                            }}
                          />
                        ))}

                        {isNowVisible(displayStart, displayEnd) ? (
                          <div
                            className="absolute inset-y-1 z-[3] w-[2px] rounded-full bg-navy/60"
                            style={{
                              left: `${calculateLeftPercent(
                                Date.now(),
                                displayStart.getTime(),
                                displayEnd.getTime()
                              )}%`
                            }}
                          />
                        ) : null}

                        {segments.map((segment) => (
                          <div
                            key={segment.key}
                            className={`absolute inset-y-2 rounded-xl ${timelineSegmentClass(
                              segment.tone
                            )}`}
                            style={{
                              left: `${segment.leftPercent}%`,
                              width: `${segment.widthPercent}%`
                            }}
                            title={segment.label}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SpacesLegendItem({
  label,
  tone
}: {
  label: string;
  tone: "available" | TimelineSegmentTone;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-4 w-4 rounded-full ${legendToneClass(tone)}`} />
      <span>{label}</span>
    </div>
  );
}

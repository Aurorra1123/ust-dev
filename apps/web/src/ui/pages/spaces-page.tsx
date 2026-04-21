import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { SelectedRange } from "./spaces/spaces-helpers";
import { useNavigate } from "react-router-dom";

import {
  createAcademicReservation,
  fetchResourceReservationStatus,
  fetchResources
} from "../../lib/api/resource-api";
import { ApiError } from "../../lib/http/errors";
import {
  addHours,
  formatDateTime,
  startOfHour,
  startOfNextHour,
  toDateTimeLocalValue
} from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { parseCompanionEmails } from "../helpers/reservation-input";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";
import { SpacesAvailabilityPanel } from "./spaces/spaces-availability-panel";
import { SpacesBookingPanel } from "./spaces/spaces-booking-panel";
import {
  getSelectedUnitReservations,
  getSelectionConflict,
  parseLocalDateTime
} from "./spaces/spaces-helpers";

const DISPLAY_WINDOW_HOURS = 12;
const DISPLAY_STEP_HOURS = 6;
const TIMELINE_MARKER_HOURS = 3;

export function SpacesPage() {
  const navigate = useNavigate();
  const locale = useLocaleStore((state) => state.locale);
  const sessionStatus = useSessionStore((state) => state.status);
  const resourcesQuery = useQuery({
    queryKey: ["resources", "academic_space"],
    queryFn: () => fetchResources("academic_space")
  });
  const [resourceId, setResourceId] = useState("");
  const [resourceUnitId, setResourceUnitId] = useState("");
  const [displayStart, setDisplayStart] = useState(() => startOfHour(new Date()));
  const [startTime, setStartTime] = useState(() =>
    toDateTimeLocalValue(startOfNextHour())
  );
  const [endTime, setEndTime] = useState(() =>
    toDateTimeLocalValue(addHours(startOfNextHour(), 1))
  );
  const [companionEmailsText, setCompanionEmailsText] = useState("");

  const selectedResource =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;
  const displayEnd = useMemo(
    () => addHours(displayStart, DISPLAY_WINDOW_HOURS),
    [displayStart]
  );
  const parsedStartTime = useMemo(() => parseLocalDateTime(startTime), [startTime]);
  const parsedEndTime = useMemo(() => parseLocalDateTime(endTime), [endTime]);
  const queryWindow = useMemo(() => {
    const selectedStart =
      parsedStartTime && !Number.isNaN(parsedStartTime.getTime())
        ? parsedStartTime
        : displayStart;
    const selectedEnd =
      parsedEndTime && !Number.isNaN(parsedEndTime.getTime())
        ? parsedEndTime
        : displayEnd;

    return {
      from:
        selectedStart.getTime() < displayStart.getTime() ? selectedStart : displayStart,
      to: selectedEnd.getTime() > displayEnd.getTime() ? selectedEnd : displayEnd
    };
  }, [displayEnd, displayStart, parsedEndTime, parsedStartTime]);
  const scheduleQuery = useQuery({
    queryKey: [
      "resource-reservation-status",
      selectedResource?.id ?? "none",
      queryWindow.from.toISOString(),
      queryWindow.to.toISOString()
    ],
    queryFn: () =>
      fetchResourceReservationStatus(selectedResource!.id, {
        from: queryWindow.from.toISOString(),
        to: queryWindow.to.toISOString()
      }),
    enabled: Boolean(selectedResource)
  });
  const selectedUnit =
    selectedResource?.units.find((unit) => unit.id === resourceUnitId) ?? null;
  const selectedUnitReservations = useMemo(
    () => getSelectedUnitReservations(scheduleQuery.data, resourceUnitId),
    [resourceUnitId, scheduleQuery.data]
  );
  const timelineMarkers = useMemo(
    () =>
      Array.from(
        { length: DISPLAY_WINDOW_HOURS / TIMELINE_MARKER_HOURS + 1 },
        (_, index) => addHours(displayStart, index * TIMELINE_MARKER_HOURS)
      ),
    [displayStart]
  );
  const selectedRange = useMemo<SelectedRange | null>(() => {
    if (!parsedStartTime || !parsedEndTime) {
      return null;
    }

    if (
      Number.isNaN(parsedStartTime.getTime()) ||
      Number.isNaN(parsedEndTime.getTime()) ||
      parsedEndTime.getTime() <= parsedStartTime.getTime()
    ) {
      return null;
    }

    return {
      start: parsedStartTime,
      end: parsedEndTime
    };
  }, [parsedEndTime, parsedStartTime]);
  const selectionConflict = useMemo(
    () =>
      getSelectionConflict({
        locale,
        selectedRange,
        schedule: scheduleQuery.data,
        selectedUnit,
        selectedUnitReservations
      }),
    [locale, scheduleQuery.data, selectedRange, selectedUnit, selectedUnitReservations]
  );

  useEffect(() => {
    const firstResource = resourcesQuery.data?.[0];

    if (!resourceId && firstResource) {
      setResourceId(firstResource.id);
    }
  }, [resourceId, resourcesQuery.data]);

  useEffect(() => {
    const firstUnit = selectedResource?.units[0];

    if (!firstUnit) {
      setResourceUnitId("");
      return;
    }

    if (!selectedResource.units.some((unit) => unit.id === resourceUnitId)) {
      setResourceUnitId(firstUnit.id);
    }
  }, [resourceUnitId, selectedResource]);

  const reservationMutation = useMutation({
    mutationFn: createAcademicReservation,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["orders"]
      });
      navigate(`/orders/${result.orderId}`);
    }
  });

  return (
    <PageSection
      title={localeText(locale, "学术空间预约", "Study Space Booking")}
      description={localeText(
        locale,
        "先看可用时间，再决定开始与结束时间。连续时间视图会直接标出占用和关闭区间。",
        "Inspect availability before booking. The continuous timeline marks occupied and closed periods directly."
      )}
    >
      {resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入学术空间", "Loading study spaces")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "学术空间暂时无法加载", "Study spaces are unavailable")}
          description={(resourcesQuery.error as ApiError).message}
        />
      ) : !resourcesQuery.data?.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有可用学术空间", "No study spaces available")}
          description={localeText(locale, "请稍后刷新。", "Please refresh later.")}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[260px,minmax(0,1fr),340px]">
          <aside className="grid gap-4">
            <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
              <p className="text-sm font-semibold text-ink">
                {localeText(locale, "资源", "Resources")}
              </p>
              <div className="mt-4 grid gap-3">
                {resourcesQuery.data.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      resource.id === selectedResource?.id
                        ? "border-ember bg-ember/10"
                        : "border-ink/10 bg-sand hover:border-moss"
                    }`}
                    onClick={() => setResourceId(resource.id)}
                  >
                    <p className="text-sm font-semibold text-ink">{resource.name}</p>
                    <p className="mt-1 text-xs text-ink/45">
                      {localeText(
                        locale,
                        `${resource.units.length} 个单元`,
                        `${resource.units.length} units`
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedResource ? (
              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-ink">{selectedResource.name}</p>
                <p className="mt-2 text-sm text-slate">
                  {selectedResource.location ||
                    localeText(locale, "校内位置待补充", "Campus location to be added")}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/45">
                  {localeText(locale, "当前视窗", "Current Window")}
                </p>
                <p className="mt-2 text-sm text-ink">
                  {formatDateTime(displayStart.toISOString())} {" → "}{" "}
                  {formatDateTime(displayEnd.toISOString())}
                </p>
              </div>
            ) : null}
          </aside>

          <SpacesAvailabilityPanel
            locale={locale}
            selectedResource={selectedResource}
            selectedUnitId={resourceUnitId}
            displayStart={displayStart}
            displayEnd={displayEnd}
            timelineMarkers={timelineMarkers}
            schedule={scheduleQuery.data}
            isLoading={scheduleQuery.isLoading}
            isError={scheduleQuery.isError}
            error={scheduleQuery.error as Error | null}
            selectedRange={selectedRange}
            onMovePrevious={() => setDisplayStart(addHours(displayStart, -DISPLAY_STEP_HOURS))}
            onMoveCurrent={() => setDisplayStart(startOfHour(new Date()))}
            onMoveNext={() => setDisplayStart(addHours(displayStart, DISPLAY_STEP_HOURS))}
            onSelectUnit={setResourceUnitId}
          />

          <SpacesBookingPanel
            locale={locale}
            sessionStatus={sessionStatus}
            selectedResourceName={selectedResource?.name ?? null}
            selectedUnit={selectedUnit}
            startTime={startTime}
            endTime={endTime}
            selectedRange={selectedRange}
            selectionConflict={selectionConflict}
            displayStart={displayStart}
            displayEnd={displayEnd}
            schedule={scheduleQuery.data}
            isScheduleLoading={scheduleQuery.isLoading}
            isScheduleError={scheduleQuery.isError}
            selectedUnitReservations={selectedUnitReservations}
            companionEmailsText={companionEmailsText}
            isPending={reservationMutation.isPending}
            error={reservationMutation.error as Error | null}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onCompanionEmailsChange={setCompanionEmailsText}
            onAlignToSelection={() => {
              if (selectedRange) {
                setDisplayStart(startOfHour(selectedRange.start));
              }
            }}
            onSubmit={() =>
              reservationMutation.mutate({
                resourceUnitId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                companionEmails: parseCompanionEmails(companionEmailsText)
              })
            }
          />
        </div>
      )}
    </PageSection>
  );
}

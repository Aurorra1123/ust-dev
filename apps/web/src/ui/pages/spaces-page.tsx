import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  createAcademicReservation,
  fetchResourceReservationStatus,
  fetchResources
} from "../../lib/api/resource-api";
import { ApiError } from "../../lib/http/errors";
import {
  addHours,
  formatDate,
  formatDateTime,
  formatTime,
  startOfHour,
  startOfNextHour,
  toDateTimeLocalValue
} from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import type { Locale } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";

const DISPLAY_WINDOW_HOURS = 12;
const DISPLAY_STEP_HOURS = 6;
const TIMELINE_MARKER_HOURS = 3;

type TimelineSegmentTone = "occupied" | "current" | "closed" | "selection";

type TimelineSegment = {
  key: string;
  leftPercent: number;
  widthPercent: number;
  tone: TimelineSegmentTone;
  label: string;
};

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
    () =>
      scheduleQuery.data?.academicReservations
        .filter((reservation) => reservation.resourceUnitId === resourceUnitId)
        .sort(
          (left, right) =>
            new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
        ) ?? [],
    [resourceUnitId, scheduleQuery.data?.academicReservations]
  );
  const timelineMarkers = useMemo(
    () =>
      Array.from(
        { length: DISPLAY_WINDOW_HOURS / TIMELINE_MARKER_HOURS + 1 },
        (_, index) => addHours(displayStart, index * TIMELINE_MARKER_HOURS)
      ),
    [displayStart]
  );
  const selectedRange = useMemo(() => {
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
  const selectionConflict = useMemo(() => {
    if (!selectedRange || !scheduleQuery.data || !selectedUnit) {
      return null;
    }

    const overlappingClosure = scheduleQuery.data.closures.find((closure) =>
      rangesOverlap(selectedRange.start, selectedRange.end, closure.startsAt, closure.endsAt)
    );

    if (overlappingClosure) {
      return {
        tone: "danger" as const,
        title: localeText(locale, "所选时间命中关闭区间", "Selected range is closed"),
        description:
          overlappingClosure.reason ||
          localeText(
            locale,
            "当前资源在这段时间不可预约，请调整时间后再提交。",
            "This resource is unavailable during the selected time window. Choose another time."
          )
      };
    }

    const overlappingReservation = selectedUnitReservations.find((reservation) =>
      rangesOverlap(
        selectedRange.start,
        selectedRange.end,
        reservation.startTime,
        reservation.endTime
      )
    );

    if (overlappingReservation) {
      return {
        tone: "danger" as const,
        title: localeText(locale, "所选时间与现有预约冲突", "Selected range conflicts"),
        description: localeText(
          locale,
          `${selectedUnit.name} 在 ${formatDateTime(overlappingReservation.startTime)} 至 ${formatDateTime(overlappingReservation.endTime)} 已被占用。`,
          `${selectedUnit.name} is already occupied from ${formatDateTime(overlappingReservation.startTime)} to ${formatDateTime(overlappingReservation.endTime)}.`
        )
      };
    }

    return {
      tone: "success" as const,
      title: localeText(locale, "当前时段在已加载窗口内可预约", "Selected range is available"),
      description: localeText(
        locale,
        "可视化视图中暂未发现关闭或冲突区间，可以继续提交预约。",
        "No closures or conflicts were found in the loaded window. You can continue with the booking."
      )
    };
  }, [locale, scheduleQuery.data, selectedRange, selectedUnit, selectedUnitReservations]);

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

          <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-ink">
                  {selectedResource?.name ??
                    localeText(locale, "请选择资源", "Select a resource")}
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
                  onClick={() => setDisplayStart(addHours(displayStart, -DISPLAY_STEP_HOURS))}
                >
                  {localeText(locale, "上一段", "Previous")}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                  onClick={() => setDisplayStart(startOfHour(new Date()))}
                >
                  {localeText(locale, "回到当前", "Back to Now")}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                  onClick={() => setDisplayStart(addHours(displayStart, DISPLAY_STEP_HOURS))}
                >
                  {localeText(locale, "下一段", "Next")}
                </button>
              </div>
            </div>

            {scheduleQuery.isLoading ? (
              <div className="mt-5">
                <StatePanel
                  tone="loading"
                  title={localeText(locale, "正在载入可用时间视图", "Loading availability")}
                  description={localeText(locale, "请稍候。", "Please wait.")}
                />
              </div>
            ) : scheduleQuery.isError ? (
              <div className="mt-5">
                <StatePanel
                  tone="danger"
                  title={localeText(locale, "可用时间视图暂时无法加载", "Availability is unavailable")}
                  description={(scheduleQuery.error as ApiError).message}
                />
              </div>
            ) : selectedResource ? (
              <div className="mt-5 grid gap-4">
                {scheduleQuery.data?.channelStatus.status !== "open" ? (
                  <StatePanel
                    tone="danger"
                    title={localeText(
                      locale,
                      "当前资源预约通道不是开放状态",
                      "Booking channel is not open"
                    )}
                    description={
                      scheduleQuery.data?.channelStatus.activeClosureReason ||
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
                            {index === 0 ? formatDate(marker.toISOString()) : formatTime(marker.toISOString())}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3">
                      {selectedResource.units.map((unit) => {
                        const reservationSegments =
                          scheduleQuery.data?.academicReservations.filter(
                            (reservation) => reservation.resourceUnitId === unit.id
                          ) ?? [];
                        const segments = buildTimelineSegments({
                          displayStart,
                          displayEnd,
                          unitName: unit.name,
                          reservations: reservationSegments,
                          closures: scheduleQuery.data?.closures ?? [],
                          selectedRange: unit.id === resourceUnitId ? selectedRange : null
                        });
                        const rowSummary = summarizeUnitWindow(
                          reservationSegments.length,
                          scheduleQuery.data?.closures.length ?? 0,
                          locale
                        );

                        return (
                          <button
                            key={unit.id}
                            type="button"
                            className={`flex min-w-[780px] items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                              unit.id === resourceUnitId
                                ? "border-ember bg-ember/10"
                                : "border-ink/10 bg-sand hover:border-moss"
                            }`}
                            onClick={() => setResourceUnitId(unit.id)}
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

          <form
            className="grid gap-4 rounded-[24px] border border-navy/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              reservationMutation.mutate({
                resourceUnitId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                companionEmails: parseCompanionEmails(companionEmailsText)
              });
            }}
          >
            <h3 className="text-xl font-semibold text-ink">
              {selectedUnit
                ? `${selectedResource?.name} · ${selectedUnit.name}`
                : localeText(locale, "请选择资源单元", "Select a unit")}
            </h3>

            <label className="grid gap-2 text-sm text-ink/75">
              {localeText(locale, "开始时间", "Start Time")}
              <input
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm text-ink/75">
              {localeText(locale, "结束时间", "End Time")}
              <input
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>

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
              <StatePanel
                tone={selectionConflict.tone}
                title={selectionConflict.title}
                description={selectionConflict.description}
              />
            ) : null}

            {selectedRange && !rangeIntersectsWindow(selectedRange, displayStart, displayEnd) ? (
              <button
                type="button"
                className="rounded-full border border-navy/10 px-4 py-3 text-sm text-ink transition hover:border-moss"
                onClick={() => setDisplayStart(startOfHour(selectedRange.start))}
              >
                {localeText(locale, "将时间视图对齐到所选时段", "Align timeline to selection")}
              </button>
            ) : null}

            <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                {localeText(locale, "状态说明", "Legend")}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-slate">
                <LegendItem
                  label={localeText(locale, "可预约区间", "Available")}
                  tone="available"
                />
                <LegendItem
                  label={localeText(locale, "已占用区间", "Occupied")}
                  tone="occupied"
                />
                <LegendItem
                  label={localeText(locale, "当前进行中", "In Progress")}
                  tone="current"
                />
                <LegendItem
                  label={localeText(locale, "关闭区间", "Closed")}
                  tone="closed"
                />
                <LegendItem
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
              {scheduleQuery.data?.closures.length ? (
                <div className="mt-3 grid gap-2">
                  {scheduleQuery.data.closures.slice(0, 4).map((closure) => (
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
                className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                value={companionEmailsText}
                onChange={(event) => setCompanionEmailsText(event.target.value)}
              />
            </label>

            {reservationMutation.isError ? (
              <StatePanel
                tone="danger"
                title={localeText(locale, "预约未提交成功", "Booking failed")}
                description={(reservationMutation.error as ApiError).message}
              />
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={
                sessionStatus !== "authenticated" ||
                scheduleQuery.isLoading ||
                scheduleQuery.isError ||
                !resourceUnitId ||
                !selectedRange ||
                selectionConflict?.tone === "danger" ||
                reservationMutation.isPending
              }
            >
              {sessionStatus === "authenticated"
                ? reservationMutation.isPending
                  ? localeText(locale, "提交中", "Submitting")
                  : localeText(locale, "提交预约", "Submit Booking")
                : localeText(locale, "请先登录后预约", "Sign in before booking")}
            </button>
          </form>
        </div>
      )}
    </PageSection>
  );
}

function LegendItem({
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

function buildTimelineSegments(params: {
  displayStart: Date;
  displayEnd: Date;
  unitName: string;
  reservations: Array<{
    orderId: string;
    startTime: string;
    endTime: string;
  }>;
  closures: Array<{
    startsAt: string;
    endsAt: string | null;
    reason: string | null;
  }>;
  selectedRange: { start: Date; end: Date } | null;
}): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const displayStartMs = params.displayStart.getTime();
  const displayEndMs = params.displayEnd.getTime();
  const now = Date.now();

  for (const closure of params.closures) {
    const segment = createTimelineSegment({
      start: new Date(closure.startsAt).getTime(),
      end: closure.endsAt
        ? new Date(closure.endsAt).getTime()
        : Number.POSITIVE_INFINITY,
      displayStart: displayStartMs,
      displayEnd: displayEndMs,
      tone: "closed",
      key: `closure-${closure.startsAt}-${closure.endsAt ?? "open"}`,
      label: closure.reason ?? "closure"
    });

    if (segment) {
      segments.push(segment);
    }
  }

  for (const reservation of params.reservations) {
    const reservationStart = new Date(reservation.startTime).getTime();
    const reservationEnd = new Date(reservation.endTime).getTime();
    const segment = createTimelineSegment({
      start: reservationStart,
      end: reservationEnd,
      displayStart: displayStartMs,
      displayEnd: displayEndMs,
      tone:
        reservationStart <= now && reservationEnd >= now ? "current" : "occupied",
      key: `reservation-${reservation.orderId}-${reservation.startTime}`,
      label: `${params.unitName}: ${reservation.startTime}`
    });

    if (segment) {
      segments.push(segment);
    }
  }

  if (params.selectedRange) {
    const selectionSegment = createTimelineSegment({
      start: params.selectedRange.start.getTime(),
      end: params.selectedRange.end.getTime(),
      displayStart: displayStartMs,
      displayEnd: displayEndMs,
      tone: "selection",
      key: `selection-${params.selectedRange.start.toISOString()}`,
      label: "selection"
    });

    if (selectionSegment) {
      segments.push(selectionSegment);
    }
  }

  return segments;
}

function createTimelineSegment(params: {
  start: number;
  end: number;
  displayStart: number;
  displayEnd: number;
  tone: TimelineSegmentTone;
  key: string;
  label: string;
}): TimelineSegment | null {
  const start = Math.max(params.start, params.displayStart);
  const end = Math.min(params.end, params.displayEnd);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    params.displayEnd <= params.displayStart
  ) {
    return null;
  }

  return {
    key: params.key,
    leftPercent: calculateLeftPercent(start, params.displayStart, params.displayEnd),
    widthPercent: Math.max(
      calculateLeftPercent(end, params.displayStart, params.displayEnd) -
        calculateLeftPercent(start, params.displayStart, params.displayEnd),
      1.5
    ),
    tone: params.tone,
    label: params.label
  };
}

function calculateLeftPercent(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

function isNowVisible(displayStart: Date, displayEnd: Date) {
  const now = Date.now();

  return now >= displayStart.getTime() && now <= displayEnd.getTime();
}

function timelineSegmentClass(tone: TimelineSegmentTone) {
  switch (tone) {
    case "occupied":
      return "z-[2] border border-gold/30 bg-[#fff2d8]";
    case "current":
      return "z-[2] border border-navy/25 bg-[#dfeaff]";
    case "closed":
      return "z-[1] border border-ink/10 bg-[#edf0f5]";
    case "selection":
      return "z-[4] border-2 border-ember/50 bg-ember/20";
  }
}

function legendToneClass(tone: "available" | TimelineSegmentTone) {
  switch (tone) {
    case "available":
      return "bg-moss/60";
    case "occupied":
      return "bg-gold/70";
    case "current":
      return "bg-navy/70";
    case "closed":
      return "bg-ink/35";
    case "selection":
      return "bg-ember/80";
  }
}

function summarizeUnitWindow(
  reservationCount: number,
  closureCount: number,
  locale: Locale
) {
  if (reservationCount === 0 && closureCount === 0) {
    return localeText(locale, "当前窗口内没有占用", "No conflicts in this window");
  }

  return localeText(
    locale,
    `${reservationCount} 段占用 · ${closureCount} 段关闭`,
    `${reservationCount} occupied · ${closureCount} closed`
  );
}

function rangeIntersectsWindow(
  range: { start: Date; end: Date },
  displayStart: Date,
  displayEnd: Date
) {
  return (
    range.end.getTime() > displayStart.getTime() &&
    range.start.getTime() < displayEnd.getTime()
  );
}

function rangesOverlap(
  start: Date,
  end: Date,
  comparedStartRaw: string,
  comparedEndRaw: string | null
) {
  const comparedStart = new Date(comparedStartRaw).getTime();
  const comparedEnd = comparedEndRaw
    ? new Date(comparedEndRaw).getTime()
    : Number.POSITIVE_INFINITY;

  return start.getTime() < comparedEnd && end.getTime() > comparedStart;
}

function parseCompanionEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function parseLocalDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

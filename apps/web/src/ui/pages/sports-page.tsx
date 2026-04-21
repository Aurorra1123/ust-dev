import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  createSportsReservation,
  fetchResourceDetail,
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
  startOfNextHour
} from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { parseCompanionEmails } from "../helpers/reservation-input";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";

const SLOT_COUNT = 8;

type CellState =
  | "available"
  | "occupied"
  | "in_progress"
  | "closed"
  | "selected";

export function SportsPage() {
  const navigate = useNavigate();
  const locale = useLocaleStore((state) => state.locale);
  const sessionStatus = useSessionStore((state) => state.status);
  const [resourceId, setResourceId] = useState("");
  const [mode, setMode] = useState<"unit" | "group">("unit");
  const [targetId, setTargetId] = useState("");
  const [slotStarts, setSlotStarts] = useState<string[]>([]);
  const [companionEmailsText, setCompanionEmailsText] = useState("");
  const [displayStart, setDisplayStart] = useState(() => startOfHour(new Date()));

  const resourcesQuery = useQuery({
    queryKey: ["resources", "sports_facility"],
    queryFn: () => fetchResources("sports_facility")
  });
  const resourceDetailQuery = useQuery({
    queryKey: ["resource-detail", resourceId],
    queryFn: () => fetchResourceDetail(resourceId),
    enabled: Boolean(resourceId)
  });

  const displayEnd = useMemo(() => addHours(displayStart, SLOT_COUNT), [displayStart]);
  const scheduleQuery = useQuery({
    queryKey: [
      "resource-reservation-status",
      resourceId,
      displayStart.toISOString(),
      displayEnd.toISOString()
    ],
    queryFn: () =>
      fetchResourceReservationStatus(resourceId, {
        from: displayStart.toISOString(),
        to: displayEnd.toISOString()
      }),
    enabled: Boolean(resourceId)
  });

  const currentResource =
    resourceDetailQuery.data ??
    (resourceId ? null : null);

  const currentResourceSummary =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;
  const hasGroupedBooking = (currentResource?.groups.length ?? 0) > 0;
  const resourceUnitNameMap = useMemo(
    () => new Map(currentResource?.units.map((unit) => [unit.id, unit.name]) ?? []),
    [currentResource]
  );

  const slotMoments = useMemo(
    () => Array.from({ length: SLOT_COUNT }, (_, index) => addHours(displayStart, index)),
    [displayStart]
  );

  const availableTargets = useMemo(() => {
    if (!currentResource) {
      return [];
    }

    if (mode === "group") {
      return currentResource.groups.map((group) => ({
        id: group.id,
        label: group.name,
        detail: summarizeNames(
          group.items.map(
            (item) => resourceUnitNameMap.get(item.resourceUnitId) ?? item.resourceUnitId
          ),
          locale
        )
      }));
    }

    return currentResource.units.map((unit) => ({
      id: unit.id,
      label: unit.name,
      detail: unit.code
    }));
  }, [currentResource, locale, mode, resourceUnitNameMap]);

  const selectedGroup = useMemo(
    () => currentResource?.groups.find((group) => group.id === targetId) ?? null,
    [currentResource, targetId]
  );
  const selectedGroupUnitIds = useMemo(
    () => new Set(selectedGroup?.items.map((item) => item.resourceUnitId) ?? []),
    [selectedGroup]
  );
  const selectedGroupMemberNames = useMemo(
    () =>
      selectedGroup?.items.map(
        (item) => resourceUnitNameMap.get(item.resourceUnitId) ?? item.resourceUnitId
      ) ?? [],
    [resourceUnitNameMap, selectedGroup]
  );

  useEffect(() => {
    const firstResource = resourcesQuery.data?.[0];

    if (!resourceId && firstResource) {
      setResourceId(firstResource.id);
    }
  }, [resourceId, resourcesQuery.data]);

  useEffect(() => {
    if (!currentResource) {
      return;
    }

    if (mode === "group" && currentResource.groups.length === 0) {
      setMode("unit");
    }
  }, [currentResource, mode]);

  useEffect(() => {
    const firstTarget = availableTargets[0];

    if (!targetId && firstTarget) {
      setTargetId(firstTarget.id);
    }
  }, [availableTargets, targetId]);

  useEffect(() => {
    setTargetId(availableTargets[0]?.id ?? "");
    setSlotStarts([]);
  }, [mode, resourceId, availableTargets]);

  const sportsMutation = useMutation({
    mutationFn: createSportsReservation,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["resource-reservation-status", resourceId] })
      ]);
      navigate(`/orders/${result.orderId}`);
    }
  });

  const bookingThreshold = useMemo(() => startOfNextHour(new Date()), []);
  const currentHourStart = useMemo(() => startOfHour(new Date()), []);

  function getSlotState(resourceUnitId: string, slotStart: Date): CellState {
    const slotEnd = addHours(slotStart, 1);
    const slotStartTime = slotStart.getTime();
    const slotEndTime = slotEnd.getTime();
    const now = Date.now();

    if (isSlotClosed(scheduleQuery.data, slotStart, slotEnd)) {
      return "closed";
    }

    const matchedReservation = scheduleQuery.data?.sportsReservations.find(
      (reservation) =>
        reservation.resourceUnitId === resourceUnitId &&
        new Date(reservation.startTime).getTime() < slotEndTime &&
        new Date(reservation.endTime).getTime() > slotStartTime
    );

    if (matchedReservation) {
      return now >= slotStartTime && now < slotEndTime ? "in_progress" : "occupied";
    }

    if (slotStartTime < bookingThreshold.getTime()) {
      return now >= slotStartTime && now < slotEndTime ? "in_progress" : "closed";
    }

    if (
      mode === "unit" &&
      targetId === resourceUnitId &&
      slotStarts.includes(slotStart.toISOString())
    ) {
      return "selected";
    }

    return "available";
  }

  function getGroupSlotState(slotStart: Date): CellState {
    if (!selectedGroup) {
      return "closed";
    }

    const memberStates = currentResource?.units
      .filter((unit) => selectedGroupUnitIds.has(unit.id))
      .map((unit) => getSlotState(unit.id, slotStart)) ?? [];

    if (!memberStates.length) {
      return "closed";
    }

    if (slotStarts.includes(slotStart.toISOString())) {
      return "selected";
    }

    if (memberStates.some((state) => state === "closed")) {
      return "closed";
    }

    if (memberStates.some((state) => state === "in_progress")) {
      return "in_progress";
    }

    if (memberStates.some((state) => state === "occupied")) {
      return "occupied";
    }

    return "available";
  }

  function toggleSlot(slotStartIso: string) {
    setSlotStarts((current) =>
      current.includes(slotStartIso)
        ? current.filter((item) => item !== slotStartIso)
        : [...current, slotStartIso].sort()
    );
  }

  return (
    <PageSection
      title={localeText(locale, "体育馆预约", "Sports Booking")}
      description={localeText(
        locale,
        "左侧资源，中间时间表，右侧状态说明与提交。",
        "Resources on the left, schedule in the middle, and submission controls on the right."
      )}
    >
      {resourcesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入体育资源", "Loading sports resources")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "体育资源暂时无法加载", "Sports resources are unavailable")}
          description={(resourcesQuery.error as ApiError).message}
        />
      ) : !resourcesQuery.data?.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有体育资源", "No sports resources")}
          description={localeText(locale, "请稍后刷新。", "Please refresh later.")}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[260px,minmax(0,1fr),320px]">
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
                      resource.id === currentResourceSummary?.id
                        ? "border-ember bg-ember/10"
                        : "border-ink/10 bg-sand hover:border-moss"
                    }`}
                    onClick={() => setResourceId(resource.id)}
                    >
                    <p className="text-sm font-semibold text-ink">{resource.name}</p>
                    <p className="mt-1 text-xs text-ink/45">
                      {localeText(
                        locale,
                        `${resource.unitCount} 个单元`,
                        `${resource.unitCount} units`
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {currentResource ? (
              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-ink">{currentResource.name}</p>
                <p className="mt-2 text-sm text-slate">
                  {currentResource.location ||
                    localeText(locale, "校内位置待补充", "Campus location to be added")}
                </p>
              </div>
            ) : null}
          </aside>

          <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {formatDate(displayStart.toISOString())}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setDisplayStart(addHours(displayStart, -SLOT_COUNT))}
                  disabled={displayStart.getTime() <= currentHourStart.getTime()}
                >
                  {localeText(locale, "上一段", "Previous")}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                  onClick={() => setDisplayStart(addHours(displayStart, SLOT_COUNT))}
                >
                  {localeText(locale, "下一段", "Next")}
                </button>
              </div>
            </div>

            {scheduleQuery.isLoading ? (
              <div className="mt-4">
                <StatePanel
                  tone="loading"
                  title={localeText(locale, "正在载入时段状态", "Loading schedule")}
                  description={localeText(locale, "请稍候。", "Please wait.")}
                />
              </div>
            ) : scheduleQuery.isError ? (
              <div className="mt-4">
                <StatePanel
                  tone="danger"
                  title={localeText(locale, "时段状态暂时无法加载", "Schedule is unavailable")}
                  description={(scheduleQuery.error as ApiError).message}
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
                    const groupState = getGroupSlotState(slot);

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
                            onClick={() => toggleSlot(slotIso)}
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
                        const state = getSlotState(unit.id, slot);

                        return (
                          <button
                            key={`${unit.id}-${slotIso}`}
                            type="button"
                            className={`min-h-[82px] rounded-2xl border px-3 py-3 text-left transition ${cellStateClass(
                              state
                            )}`}
                            disabled={
                              mode !== "unit" ||
                              (state !== "available" && state !== "selected")
                            }
                            onClick={() => {
                              setTargetId(unit.id);
                              toggleSlot(slotIso);
                            }}
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

          <form
            className="grid gap-4 rounded-[24px] border border-ink/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              sportsMutation.mutate({
                ...(mode === "group" ? { resourceGroupId: targetId } : { resourceUnitId: targetId }),
                slotStarts,
                companionEmails: parseCompanionEmails(companionEmailsText)
              });
            }}
          >
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === "unit" ? "bg-ember text-white" : "bg-sand text-ink"
                }`}
                onClick={() => setMode("unit")}
              >
                {localeText(locale, "单场地", "Single Court")}
              </button>
              {hasGroupedBooking ? (
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    mode === "group" ? "bg-ember text-white" : "bg-sand text-ink"
                  }`}
                  onClick={() => setMode("group")}
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
                onChange={(event) => {
                  setTargetId(event.target.value);
                  setSlotStarts([]);
                }}
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
                      onClick={() => toggleSlot(slotStartIso)}
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
                <LegendItem label={localeText(locale, "可预约", "Available")} tone="available" />
                <LegendItem label={localeText(locale, "已占用", "Occupied")} tone="occupied" />
                <LegendItem
                  label={localeText(locale, "进行中", "In Progress")}
                  tone="in_progress"
                />
                <LegendItem
                  label={localeText(locale, "已选中", "Selected")}
                  tone="selected"
                />
                <LegendItem label={localeText(locale, "不可约", "Closed")} tone="closed" />
              </div>
            </div>

            <label className="grid gap-2 text-sm text-ink/75">
              {localeText(locale, "同行人邮箱", "Companion Emails")}
              <textarea
                className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                value={companionEmailsText}
                onChange={(event) => setCompanionEmailsText(event.target.value)}
              />
            </label>

            {sportsMutation.isError ? (
              <StatePanel
                tone="danger"
                title={localeText(locale, "预约未提交成功", "Booking failed")}
                description={(sportsMutation.error as ApiError).message}
              />
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={
                sessionStatus !== "authenticated" ||
                !targetId ||
                slotStarts.length === 0 ||
                sportsMutation.isPending
              }
            >
              {sessionStatus === "authenticated"
                ? sportsMutation.isPending
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
  tone: CellState;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-4 w-4 rounded-full ${legendToneClass(tone)}`} />
      <span>{label}</span>
    </div>
  );
}

function cellStateLabel(state: CellState, locale: "zh-CN" | "en") {
  switch (state) {
    case "available":
      return localeText(locale, "可预约", "Available");
    case "occupied":
      return localeText(locale, "已占用", "Occupied");
    case "in_progress":
      return localeText(locale, "进行中", "In Progress");
    case "closed":
      return localeText(locale, "不可约", "Closed");
    case "selected":
      return localeText(locale, "已选择", "Selected");
  }
}

function headerStateLabel(state: CellState, locale: "zh-CN" | "en") {
  switch (state) {
    case "available":
      return localeText(locale, "可选", "Pick");
    case "selected":
      return localeText(locale, "已选", "Selected");
    case "occupied":
      return localeText(locale, "冲突", "Conflict");
    case "in_progress":
      return localeText(locale, "进行中", "In Progress");
    case "closed":
      return localeText(locale, "关闭", "Closed");
  }
}

function cellStateClass(state: CellState) {
  switch (state) {
    case "available":
      return "border-moss/25 bg-white hover:border-moss hover:bg-moss/10";
    case "occupied":
      return "border-gold/25 bg-[#fff6e8]";
    case "in_progress":
      return "border-navy/20 bg-[#e9f1ff]";
    case "closed":
      return "border-ink/10 bg-[#f1f3f7] opacity-70";
    case "selected":
      return "border-ember/30 bg-ember/12";
  }
}

function headerStateClass(state: CellState) {
  switch (state) {
    case "available":
      return "bg-moss/10 text-moss hover:bg-moss/18";
    case "selected":
      return "bg-ember text-white";
    case "occupied":
      return "bg-gold/15 text-[#9a6b18]";
    case "in_progress":
      return "bg-navy/10 text-navy";
    case "closed":
      return "bg-ink/8 text-ink/45";
  }
}

function legendToneClass(state: CellState) {
  switch (state) {
    case "available":
      return "bg-moss/60";
    case "occupied":
      return "bg-gold/70";
    case "in_progress":
      return "bg-navy/70";
    case "closed":
      return "bg-ink/30";
    case "selected":
      return "bg-ember/80";
  }
}

function formatNameList(names: string[], locale: "zh-CN" | "en") {
  if (!names.length) {
    return localeText(locale, "未设置", "Not set");
  }

  return names.join(locale === "zh-CN" ? "、" : ", ");
}

function summarizeNames(names: string[], locale: "zh-CN" | "en") {
  const visibleNames = names.slice(0, 2);
  const restCount = names.length - visibleNames.length;
  const base = formatNameList(visibleNames, locale);

  if (restCount <= 0) {
    return base;
  }

  return `${base} +${restCount}`;
}

function isSlotClosed(
  schedule: Awaited<ReturnType<typeof fetchResourceReservationStatus>> | undefined,
  slotStart: Date,
  slotEnd: Date
) {
  return (
    schedule?.closures.some((closure) => {
      const closureStart = new Date(closure.startsAt).getTime();
      const closureEnd = closure.endsAt
        ? new Date(closure.endsAt).getTime()
        : Number.POSITIVE_INFINITY;

      return closureStart < slotEnd.getTime() && closureEnd > slotStart.getTime();
    }) ?? false
  );
}

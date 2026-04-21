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
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
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
        detail: `${group.items.length} 个场地单元`
      }));
    }

    return currentResource.units.map((unit) => ({
      id: unit.id,
      label: unit.name,
      detail: unit.code
    }));
  }, [currentResource, mode]);

  const selectedGroup = useMemo(
    () => currentResource?.groups.find((group) => group.id === targetId) ?? null,
    [currentResource, targetId]
  );
  const selectedGroupUnitIds = useMemo(
    () => new Set(selectedGroup?.items.map((item) => item.resourceUnitId) ?? []),
    [selectedGroup]
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
    <PageSection title="体育馆预约" description="左侧资源，中间时间表，右侧状态说明与提交。">
      {resourcesQuery.isLoading ? (
        <StatePanel tone="loading" title="正在载入体育资源" description="请稍候。" />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title="体育资源暂时无法加载"
          description={(resourcesQuery.error as ApiError).message}
        />
      ) : !resourcesQuery.data?.length ? (
        <EmptyPanel title="当前没有体育资源" description="请稍后刷新。" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[260px,minmax(0,1fr),320px]">
          <aside className="grid gap-4">
            <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
              <p className="text-sm font-semibold text-ink">资源</p>
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
                      {resource.unitCount} 个单元
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {currentResource ? (
              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-ink">{currentResource.name}</p>
                <p className="mt-2 text-sm text-slate">
                  {currentResource.location || "校内位置待补充"}
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
                  上一段
                </button>
                <button
                  type="button"
                  className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                  onClick={() => setDisplayStart(addHours(displayStart, SLOT_COUNT))}
                >
                  下一段
                </button>
              </div>
            </div>

            {scheduleQuery.isLoading ? (
              <div className="mt-4">
                <StatePanel tone="loading" title="正在载入时段状态" description="请稍候。" />
              </div>
            ) : scheduleQuery.isError ? (
              <div className="mt-4">
                <StatePanel
                  tone="danger"
                  title="时段状态暂时无法加载"
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
                    场地 / 时间
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
                            {headerStateLabel(groupState)}
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
                              {cellStateLabel(state)}
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
                单场地
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  mode === "group" ? "bg-ember text-white" : "bg-sand text-ink"
                }`}
                onClick={() => setMode("group")}
                disabled={!currentResource?.groups.length}
              >
                组合场地
              </button>
            </div>

            <label className="grid gap-2 text-sm text-ink/75">
              目标
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

            <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">已选时段</p>
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
                <p className="mt-3 text-sm text-slate">请在时间表中选择时段。</p>
              )}
            </div>

            <div className="rounded-[22px] border border-navy/10 bg-sand px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">状态说明</p>
              <div className="mt-3 grid gap-2 text-sm text-slate">
                <LegendItem label="可预约" tone="available" />
                <LegendItem label="已占用" tone="occupied" />
                <LegendItem label="进行中" tone="in_progress" />
                <LegendItem label="已选中" tone="selected" />
                <LegendItem label="不可约" tone="closed" />
              </div>
            </div>

            <label className="grid gap-2 text-sm text-ink/75">
              同行人邮箱
              <textarea
                className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                value={companionEmailsText}
                onChange={(event) => setCompanionEmailsText(event.target.value)}
              />
            </label>

            {sportsMutation.isError ? (
              <StatePanel
                tone="danger"
                title="预约未提交成功"
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
                  ? "提交中"
                  : "提交预约"
                : "请先登录后预约"}
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

function cellStateLabel(state: CellState) {
  switch (state) {
    case "available":
      return "可预约";
    case "occupied":
      return "已占用";
    case "in_progress":
      return "进行中";
    case "closed":
      return "不可约";
    case "selected":
      return "已选择";
  }
}

function headerStateLabel(state: CellState) {
  switch (state) {
    case "available":
      return "可选";
    case "selected":
      return "已选";
    case "occupied":
      return "冲突";
    case "in_progress":
      return "进行中";
    case "closed":
      return "关闭";
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

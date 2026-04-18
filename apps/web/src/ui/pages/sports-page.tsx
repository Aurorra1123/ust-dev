import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  ApiError,
  createSportsReservation,
  fetchResourceDetail,
  fetchResources
} from "../../lib/api";
import { formatDateTime, startOfNextHour } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  EmptyPanel,
  GuidancePanel,
  MetricCard,
  MetricGrid,
  StatusPill
} from "../user-experience-kit";

export function SportsPage() {
  const sessionStatus = useSessionStore((state) => state.status);
  const [resourceId, setResourceId] = useState("");
  const [mode, setMode] = useState<"unit" | "group">("unit");
  const [targetId, setTargetId] = useState("");
  const [slotStarts, setSlotStarts] = useState<string[]>([]);
  const resourcesQuery = useQuery({
    queryKey: ["resources", "sports_facility"],
    queryFn: () => fetchResources("sports_facility")
  });
  const resourceDetailQuery = useQuery({
    queryKey: ["resource-detail", resourceId],
    queryFn: () => fetchResourceDetail(resourceId),
    enabled: Boolean(resourceId)
  });

  const currentResourceSummary =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;
  const currentResource = resourceDetailQuery.data ?? null;
  const totalUnits = useMemo(
    () =>
      resourcesQuery.data?.reduce((total, resource) => total + resource.units.length, 0) ??
      0,
    [resourcesQuery.data]
  );
  const totalGroups = useMemo(
    () =>
      resourcesQuery.data?.reduce((total, resource) => total + resource.groupCount, 0) ??
      0,
    [resourcesQuery.data]
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

  const slotOptions = useMemo(() => {
    const firstSlot = startOfNextHour();

    return Array.from({ length: 6 }, (_, index) => {
      const slotStart = new Date(firstSlot);
      slotStart.setHours(slotStart.getHours() + index);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotEnd.getHours() + 1);

      return {
        value: slotStart.toISOString(),
        label: `${formatDateTime(slotStart.toISOString())} - ${formatDateTime(slotEnd.toISOString())}`
      };
    });
  }, []);

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
  }, [mode, resourceId, availableTargets]);

  const sportsMutation = useMutation({
    mutationFn: createSportsReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orders"]
      });
    }
  });

  return (
    <>
      <PageHero
        eyebrow="Sports Booking"
        title="为球场与组合场地提供统一的槽位预约入口"
        description="体育设施采用 1 小时离散槽位建模。你可以在同一页面切换单场地预约和组合场地预约，系统会在统一事务内完成校验与下单。"
        aside={
          <>
            <p className="font-medium text-ink">默认展示未来 6 个槽位</p>
            <p className="mt-3 text-sm text-slate">
              可以直接体验单场地预约，也可以切换到组合预约验证整单失败逻辑。
            </p>
          </>
        }
      />

      <PageSection
        title="服务概览"
        description="体育设施页聚焦“选择资源、选择模式、选择槽位”三步。所有槽位占用都会写入统一订单和状态日志。"
      >
        <MetricGrid>
          <MetricCard
            label="设施资源"
            value={String(resourcesQuery.data?.length ?? 0)}
            detail="当前可浏览的体育设施资源数"
          />
          <MetricCard
            label="场地单元"
            value={String(totalUnits)}
            detail="所有资源单元的总数"
          />
          <MetricCard
            label="组合资源"
            value={String(totalGroups)}
            detail="可用于组合预约的资源集合"
          />
          <MetricCard
            label="槽位数量"
            value={String(slotOptions.length)}
            detail="当前默认展示未来 6 个连续槽位"
          />
        </MetricGrid>
      </PageSection>

      <PageSection
        title="体育资源与预约"
        description="左侧浏览资源、单元和组合资源，右侧切换预约模式并勾选槽位。"
      >
        {resourcesQuery.isLoading ? (
          <p className="text-sm text-ink/70">正在加载体育设施。</p>
        ) : resourcesQuery.isError ? (
          <p className="text-sm text-danger">
            {(resourcesQuery.error as ApiError).message}
          </p>
        ) : !resourcesQuery.data?.length ? (
          <EmptyPanel
            title="当前还没有可用的体育设施"
            description="可以稍后刷新，或使用管理员账号进入后台补充体育资源、资源单元和组合资源。"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),360px]">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                {resourcesQuery.data?.map((resource) => (
                  <button
                    key={resource.id}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      resource.id === currentResourceSummary?.id
                        ? "border-ember bg-ember text-white"
                        : "border-ink/15 bg-white hover:border-moss"
                    }`}
                    onClick={() => setResourceId(resource.id)}
                  >
                    {resource.name}
                  </button>
                ))}
              </div>

              {resourceDetailQuery.isLoading ? (
                <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5 text-sm text-ink/70">
                  正在加载资源详情。
                </div>
              ) : currentResource ? (
                <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">
                    Sports Resource
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    {currentResource.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate">
                    {currentResource.description || "当前资源暂无补充描述。"}
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    {currentResource.location || "校内位置待补充"}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-ink">场地单元</p>
                      <div className="mt-3 grid gap-3">
                        {currentResource.units.map((unit) => (
                          <div
                            key={unit.id}
                            className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                          >
                            <p className="font-medium text-ink">{unit.name}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">
                              {unit.code}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">组合资源</p>
                      <div className="mt-3 grid gap-3">
                        {currentResource.groups.length ? (
                          currentResource.groups.map((group) => (
                            <div
                              key={group.id}
                              className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                            >
                              <p className="font-medium text-ink">{group.name}</p>
                              <p className="mt-2 text-sm text-ink/70">
                                {group.items.length} 个单元
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-ink/15 bg-sand px-4 py-4 text-sm text-ink/60">
                            当前资源没有预设组合资源。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <form
              className="grid gap-4 rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                sportsMutation.mutate({
                  ...(mode === "group"
                    ? { resourceGroupId: targetId }
                    : { resourceUnitId: targetId }),
                  slotStarts
                });
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                创建体育预约
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    mode === "unit"
                      ? "bg-ember text-white"
                      : "bg-white text-ink"
                  }`}
                  onClick={() => setMode("unit")}
                >
                  单场地
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    mode === "group"
                      ? "bg-ember text-white"
                      : "bg-white text-ink"
                  }`}
                  onClick={() => setMode("group")}
                  disabled={!currentResource?.groups.length}
                >
                  组合场地
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="brand">
                  {mode === "group" ? "组合资源模式" : "单场地模式"}
                </StatusPill>
                <StatusPill tone="success">整单冲突则整单失败</StatusPill>
              </div>

              <label className="mt-4 grid gap-2 text-sm text-ink/75">
                目标资源
                <select
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 outline-none transition focus:border-moss"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                >
                  {availableTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.label} · {target.detail}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 grid gap-3">
                <p className="text-sm font-medium text-ink">选择槽位</p>
                {slotOptions.map((slot) => (
                  <label
                    key={slot.value}
                    className="flex items-center justify-between rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-ink/75"
                  >
                    <span>{slot.label}</span>
                    <input
                      type="checkbox"
                      checked={slotStarts.includes(slot.value)}
                      onChange={(event) => {
                        setSlotStarts((current) =>
                          event.target.checked
                            ? [...current, slot.value]
                            : current.filter((item) => item !== slot.value)
                        );
                      }}
                    />
                  </label>
                ))}
              </div>

              <GuidancePanel
                title="预约说明"
                description="体育设施按离散槽位预约。若选择组合资源，只要其中任一场地任一槽位冲突，整单都会失败。"
              >
                <div className="grid gap-2 text-sm text-slate">
                  <p>当前已选槽位：{slotStarts.length} 个</p>
                  <p>未登录时可浏览资源，但无法提交预约。</p>
                </div>
              </GuidancePanel>

              {sportsMutation.isError ? (
                <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {(sportsMutation.error as ApiError).message}
                </div>
              ) : null}

              {sportsMutation.data ? (
                <div className="mt-4 rounded-2xl border border-moss/20 bg-white px-4 py-4 text-sm text-ink/75">
                  <p className="font-medium text-ink">体育预约已创建</p>
                  <p className="mt-2">订单号：{sportsMutation.data.orderNo}</p>
                  <p className="mt-1">
                    覆盖槽位数：{sportsMutation.data.slotCount}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                className="mt-5 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
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
                    : "提交体育预约"
                  : "请先登录后预约"}
              </button>
            </form>
          </div>
        )}
      </PageSection>
    </>
  );
}

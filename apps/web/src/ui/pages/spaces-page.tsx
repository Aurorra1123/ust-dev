import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ApiError, createAcademicReservation, fetchResources } from "../../lib/api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  EmptyPanel,
  GuidancePanel,
  HighlightPanel,
  StatePanel,
  StepList,
  StatusPill
} from "../user-experience-kit";

export function SpacesPage() {
  const sessionStatus = useSessionStore((state) => state.status);
  const resourcesQuery = useQuery({
    queryKey: ["resources", "academic_space"],
    queryFn: () => fetchResources("academic_space")
  });
  const units = useMemo(
    () =>
      resourcesQuery.data?.flatMap((resource) =>
        resource.units.map((unit) => ({
          ...unit,
          resourceName: resource.name
        }))
      ) ?? [],
    [resourcesQuery.data]
  );
  const [resourceUnitId, setResourceUnitId] = useState("");
  const [startTime, setStartTime] = useState(() =>
    toDateTimeLocalValue(startOfNextHour())
  );
  const [endTime, setEndTime] = useState(() =>
    toDateTimeLocalValue(addHours(startOfNextHour(), 1))
  );
  const [companionEmailsText, setCompanionEmailsText] = useState("");

  useEffect(() => {
    const firstUnit = units[0];

    if (!resourceUnitId && firstUnit) {
      setResourceUnitId(firstUnit.id);
    }
  }, [resourceUnitId, units]);

  const selectedUnit = units.find((unit) => unit.id === resourceUnitId) ?? null;
  const durationHours = useMemo(() => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return "0";
    }

    return ((end - start) / 3_600_000).toFixed(1);
  }, [endTime, startTime]);

  const reservationMutation = useMutation({
    mutationFn: createAcademicReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orders"]
      });
    }
  });

  return (
    <>
      <PageHero
        eyebrow="Academic Spaces"
        title="为学习、研讨与协作提供统一的学术空间预约入口"
        description="这里不只是一个提交表单，而是把空间浏览、时间选择、冲突说明和预约结果整合到同一工作区里，减少来回跳转。"
        aside={
          <>
            <p className="font-medium text-ink">当前可预约单元</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{units.length}</p>
            <p className="mt-2 text-sm text-slate">
              {sessionStatus === "authenticated"
                ? "已登录，可直接提交预约。"
                : "未登录时可浏览数据，但无法提交预约。"}
            </p>
          </>
        }
      />

      <PageSection
        title="服务概览"
        description="学术空间页现在同时承担资源浏览、预约填写和结果回看三类动作，因此首页就直接把服务边界和操作顺序说明清楚。"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),420px]">
          <HighlightPanel
            eyebrow="Reservation Flow"
            title="按资源单元与连续时间段完成预约"
            description="系统会自动在开始和结束时间外加上前后各 5 分钟缓冲，因此你看到的是“展示时间”，后台会按更严格的实际占用区间校验冲突。"
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <QuickFact label="空间资源" value={String(resourcesQuery.data?.length ?? 0)} />
              <QuickFact label="预约单元" value={String(units.length)} />
              <QuickFact label="当前时长" value={`${durationHours}h`} />
              <QuickFact
                label="预约状态"
                value={sessionStatus === "authenticated" ? "已登录" : "未登录"}
              />
            </div>
          </HighlightPanel>
          <StepList
            items={[
              {
                title: "选择单元",
                description: "先从左侧浏览可用空间，再选中具体资源单元作为预约目标。"
              },
              {
                title: "填写时段",
                description: "填写开始与结束时间，系统会自动把相邻的缓冲时间一起纳入校验。"
              },
              {
                title: "查看结果",
                description: "提交成功后，订单号和状态会同步出现在“我的订单”里。"
              }
            ]}
          />
        </div>
      </PageSection>

      <PageSection
        title="空间列表与预约"
        description="左侧浏览资源与单元，右侧直接发起预约。提交成功后，记录会自动进入你的订单列表。"
      >
        {resourcesQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title="正在载入学术空间"
            description="页面正在整理当前可预约的学习与研讨空间，请稍候。"
          />
        ) : resourcesQuery.isError ? (
          <StatePanel
            tone="danger"
            title="学术空间暂时无法加载"
            description={(resourcesQuery.error as ApiError).message}
          />
        ) : !resourcesQuery.data?.length ? (
          <EmptyPanel
            title="当前还没有可用的学术空间"
            description="可以稍后刷新，或使用管理员账号进入后台补充资源与资源单元。"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
            <div className="grid gap-4">
              {selectedUnit ? (
                <div className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-sand via-white to-mist px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-moss">
                        当前选择
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-ink">
                        {selectedUnit.resourceName}
                      </h3>
                      <p className="mt-2 text-sm text-slate">
                        {selectedUnit.name} · {selectedUnit.code}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone="brand">连续时间预约</StatusPill>
                      <StatusPill tone="success">缓冲保护已开启</StatusPill>
                    </div>
                  </div>
                </div>
              ) : null}

              {resourcesQuery.data?.map((resource) => (
                <div
                  key={resource.id}
                  className="overflow-hidden rounded-[26px] border border-ink/10 bg-white"
                >
                  <div className="border-b border-navy/10 bg-gradient-to-r from-navy via-[#0d3f82] to-moss px-5 py-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                          Academic Space
                        </p>
                        <h3 className="mt-2 text-xl font-semibold">{resource.name}</h3>
                      </div>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/90">
                        {resource.unitCount} 个单元
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-sm leading-6 text-slate">
                      {resource.description || "当前资源暂无补充描述。"}
                    </p>
                    <p className="mt-2 text-sm text-slate">
                      {resource.location || "校内位置待补充"}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {resource.units.map((unit) => (
                        <label
                          key={unit.id}
                          className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                            unit.id === resourceUnitId
                              ? "border-ember bg-ember/10 shadow-[inset_0_0_0_1px_rgba(168,131,55,0.15)]"
                              : "border-ink/10 bg-sand hover:border-moss"
                          }`}
                        >
                          <span>
                            <span className="block font-medium text-ink">
                              {unit.name}
                            </span>
                            <span className="mt-1 block text-xs uppercase tracking-[0.2em] text-ink/45">
                              {unit.code}
                            </span>
                          </span>
                          <input
                            type="radio"
                            name="academic-unit"
                            checked={unit.id === resourceUnitId}
                            onChange={() => setResourceUnitId(unit.id)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="grid gap-4 rounded-[24px] border border-navy/10 bg-mist px-5 py-5"
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
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                创建预约
              </p>
              <h3 className="mt-2 text-xl font-semibold text-ink">
                {selectedUnit
                  ? `${selectedUnit.resourceName} · ${selectedUnit.name}`
                  : "请选择资源单元"}
              </h3>
              {selectedUnit ? (
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="brand">{selectedUnit.code}</StatusPill>
                  <StatusPill tone="success">前后各 5 分钟缓冲</StatusPill>
                </div>
              ) : null}

              <div className="rounded-[22px] border border-white/70 bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-moss">预约预览</p>
                <div className="mt-3 grid gap-2 text-sm text-slate">
                  <p>开始：{formatDateTime(new Date(startTime).toISOString())}</p>
                  <p>结束：{formatDateTime(new Date(endTime).toISOString())}</p>
                  <p>展示时长：{durationHours} 小时</p>
                  <p>同行人数：{parseCompanionEmails(companionEmailsText).length}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm text-ink/75">
                  开始时间
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 outline-none transition focus:border-moss"
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm text-ink/75">
                  结束时间
                  <input
                    className="rounded-2xl border border-white/70 bg-white px-4 py-3 outline-none transition focus:border-moss"
                    type="datetime-local"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm text-ink/75">
                  同行人邮箱
                  <textarea
                    className="min-h-[88px] rounded-2xl border border-white/70 bg-white px-4 py-3 outline-none transition focus:border-moss"
                    placeholder="输入已有学生账号邮箱，支持逗号或换行分隔"
                    value={companionEmailsText}
                    onChange={(event) => setCompanionEmailsText(event.target.value)}
                  />
                </label>
              </div>

              <GuidancePanel
                title="预约说明"
                description="学术空间按连续时间段预约。系统会自动扩展前后各 5 分钟缓冲，因此你看到相邻可选时段时，仍然可能因为缓冲而被判定冲突。"
              >
                <div className="grid gap-2 text-sm text-slate">
                  <p>当前预约时长：{durationHours} 小时</p>
                  <p>成功后可在“我的订单”中查看状态和日志。</p>
                </div>
              </GuidancePanel>

              {reservationMutation.isError ? (
                <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {(reservationMutation.error as ApiError).message}
                </div>
              ) : null}

              {reservationMutation.data ? (
                <div className="mt-4 rounded-2xl border border-moss/20 bg-white px-4 py-4 text-sm text-ink/75">
                  <p className="font-medium text-ink">预约已创建</p>
                  <p className="mt-2">订单号：{reservationMutation.data.orderNo}</p>
                  <p className="mt-1">
                    展示时间：{formatDateTime(reservationMutation.data.startTime)} -{" "}
                    {formatDateTime(reservationMutation.data.endTime)}
                  </p>
                  <p className="mt-1">
                    实际占用：前后各 {reservationMutation.data.bufferBeforeMin} 分钟
                    缓冲
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                className="mt-5 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                disabled={
                  sessionStatus !== "authenticated" ||
                  !resourceUnitId ||
                  reservationMutation.isPending
                }
              >
                {sessionStatus === "authenticated"
                  ? reservationMutation.isPending
                    ? "提交中"
                    : "提交学术空间预约"
                  : "请先登录后预约"}
              </button>
            </form>
          </div>
        )}
      </PageSection>
    </>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
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

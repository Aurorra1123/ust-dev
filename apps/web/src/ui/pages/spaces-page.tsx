import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ApiError, createAcademicReservation, fetchResources } from "../../lib/api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

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

  useEffect(() => {
    const firstUnit = units[0];

    if (!resourceUnitId && firstUnit) {
      setResourceUnitId(firstUnit.id);
    }
  }, [resourceUnitId, units]);

  const selectedUnit = units.find((unit) => unit.id === resourceUnitId) ?? null;

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
        title="学术空间预约已经接通真实资源数据与下单流程"
        description="这里展示的是当前可预约的学术空间资源单元。提交请求后，后端会自动扩展前后 5 分钟缓冲，并由 PostgreSQL 排斥约束兜底冲突。"
        aside={
          <>
            <p className="font-medium text-ink">当前可预约单元</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{units.length}</p>
            <p className="mt-2 text-sm text-ink/70">
              {sessionStatus === "authenticated"
                ? "已登录，可直接提交预约。"
                : "未登录时可浏览数据，但无法提交预约。"}
            </p>
          </>
        }
      />

      <PageSection title="空间列表">
        {resourcesQuery.isLoading ? (
          <p className="text-sm text-ink/70">正在加载学术空间。</p>
        ) : resourcesQuery.isError ? (
          <p className="text-sm text-danger">
            {(resourcesQuery.error as ApiError).message}
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
            <div className="grid gap-4">
              {resourcesQuery.data?.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-moss">
                        Academic Space
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-ink">
                        {resource.name}
                      </h3>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/70">
                      {resource.unitCount} 个单元
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    {resource.description || "当前资源暂无补充描述。"}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {resource.units.map((unit) => (
                      <label
                        key={unit.id}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                          unit.id === resourceUnitId
                            ? "border-ember bg-ember/10"
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
              ))}
            </div>

            <form
              className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                reservationMutation.mutate({
                  resourceUnitId,
                  startTime: new Date(startTime).toISOString(),
                  endTime: new Date(endTime).toISOString()
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
              </div>

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

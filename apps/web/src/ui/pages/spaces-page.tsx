import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createAcademicReservation, fetchResources } from "../../lib/api/resource-api";
import { ApiError } from "../../lib/http/errors";
import { addHours, startOfNextHour, toDateTimeLocalValue } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";

export function SpacesPage() {
  const navigate = useNavigate();
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
      title="学术空间预约"
      description="选择资源与时间后直接提交预约。"
    >
      {resourcesQuery.isLoading ? (
        <StatePanel tone="loading" title="正在载入学术空间" description="请稍候。" />
      ) : resourcesQuery.isError ? (
        <StatePanel
          tone="danger"
          title="学术空间暂时无法加载"
          description={(resourcesQuery.error as ApiError).message}
        />
      ) : !resourcesQuery.data?.length ? (
        <EmptyPanel title="当前没有可用学术空间" description="请稍后刷新。" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
          <div className="grid gap-4">
            {resourcesQuery.data.map((resource) => (
              <div
                key={resource.id}
                className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
              >
                <h3 className="text-xl font-semibold text-ink">{resource.name}</h3>
                <p className="mt-2 text-sm text-slate">
                  {resource.location || "校内位置待补充"}
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
                        <span className="block font-medium text-ink">{unit.name}</span>
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
                ? `${selectedUnit.resourceName} · ${selectedUnit.name}`
                : "请选择资源单元"}
            </h3>

            <label className="grid gap-2 text-sm text-ink/75">
              开始时间
              <input
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm text-ink/75">
              结束时间
              <input
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm text-ink/75">
              同行人邮箱
              <textarea
                className="min-h-[88px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 outline-none transition focus:border-moss"
                value={companionEmailsText}
                onChange={(event) => setCompanionEmailsText(event.target.value)}
              />
            </label>

            {reservationMutation.isError ? (
              <StatePanel
                tone="danger"
                title="预约未提交成功"
                description={(reservationMutation.error as ApiError).message}
              />
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={
                sessionStatus !== "authenticated" ||
                !resourceUnitId ||
                reservationMutation.isPending
              }
            >
              {sessionStatus === "authenticated"
                ? reservationMutation.isPending
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

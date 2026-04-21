import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import type { ActivityListItem } from "@campusbook/shared-types";

import {
  fetchActivities,
  fetchActivityDetail,
  fetchActivityRegistrationStatus,
  grabActivity
} from "../../lib/api/activity-api";
import { ApiError } from "../../lib/http/errors";
import { formatDateTime } from "../../lib/date";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";

export function ActivitiesPage() {
  const sessionStatus = useSessionStore((state) => state.status);
  const activitiesQuery = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities
  });
  const [activityId, setActivityId] = useState<string | null>(null);

  useEffect(() => {
    const firstActivity = activitiesQuery.data?.[0];

    if (!activityId && firstActivity) {
      setActivityId(firstActivity.id);
    }
  }, [activitiesQuery.data, activityId]);

  const selectedActivity =
    activitiesQuery.data?.find((activity) => activity.id === activityId) ??
    activitiesQuery.data?.[0] ??
    null;

  const detailQuery = useQuery({
    queryKey: ["activity-detail", selectedActivity?.id],
    queryFn: () => fetchActivityDetail(selectedActivity!.id),
    enabled: !!selectedActivity?.id
  });

  const registrationStatusQuery = useQuery({
    queryKey: ["activity-registration-status", selectedActivity?.id],
    queryFn: () => fetchActivityRegistrationStatus(selectedActivity!.id),
    enabled: !!selectedActivity?.id && sessionStatus === "authenticated",
    refetchInterval: (query) =>
      query.state.data?.status === "queued" ? 2_000 : false
  });

  const grabMutation = useMutation({
    mutationFn: ({ activityId: currentActivityId, ticketId }: { activityId: string; ticketId: string }) =>
      grabActivity(currentActivityId, { ticketId }),
    onSuccess: async () => {
      await registrationStatusQuery.refetch();
    }
  });

  const soldOut = useMemo(
    () => (selectedActivity?.remainingQuota ?? 0) <= 0,
    [selectedActivity]
  );

  return (
    <PageSection
      title="校园活动"
      description="选择活动后查看票种并完成报名。"
    >
      {activitiesQuery.isLoading ? (
        <StatePanel tone="loading" title="正在载入活动" description="请稍候。" />
      ) : activitiesQuery.isError ? (
        <StatePanel
          tone="danger"
          title="活动暂时无法加载"
          description={(activitiesQuery.error as ApiError).message}
        />
      ) : !activitiesQuery.data?.length ? (
        <EmptyPanel title="当前没有活动" description="请稍后刷新。" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px,minmax(0,1fr)]">
          <div className="grid gap-3">
            {activitiesQuery.data.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                active={activity.id === selectedActivity?.id}
                onSelect={() => setActivityId(activity.id)}
              />
            ))}
          </div>

          {selectedActivity ? (
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <h3 className="text-2xl font-semibold text-ink">
                  {selectedActivity.title}
                </h3>
                <p className="mt-2 text-sm text-slate">
                  {selectedActivity.location || "活动地点待补充"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="brand">{statusLabel(selectedActivity.status)}</StatusPill>
                  <StatusPill tone={soldOut ? "danger" : "success"}>
                    {soldOut ? "名额紧张" : "可报名"}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate">
                  {selectedActivity.description || "当前活动暂无补充描述。"}
                </p>
                <p className="mt-3 text-sm text-slate">
                  开售 {formatDateTime(selectedActivity.saleStartTime)} · 停售 {formatDateTime(selectedActivity.saleEndTime)}
                </p>
              </div>

              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <h3 className="text-lg font-semibold text-ink">票种</h3>
                {detailQuery.isLoading ? (
                  <div className="mt-4">
                    <StatePanel tone="loading" title="正在载入票种" description="请稍候。" />
                  </div>
                ) : detailQuery.isError ? (
                  <div className="mt-4">
                    <StatePanel
                      tone="danger"
                      title="票种暂时无法加载"
                      description={(detailQuery.error as ApiError).message}
                    />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {detailQuery.data?.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-ink">{ticket.name}</p>
                            <p className="mt-2 text-sm text-slate">
                              库存 {ticket.stock} / 已保留 {ticket.reserved}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full bg-ember px-4 py-2 text-sm text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                            disabled={
                              sessionStatus !== "authenticated" ||
                              grabMutation.isPending ||
                              soldOut
                            }
                            onClick={() =>
                              grabMutation.mutate({
                                activityId: selectedActivity.id,
                                ticketId: ticket.id
                              })
                            }
                          >
                            {sessionStatus === "authenticated"
                              ? grabMutation.isPending
                                ? "提交中"
                                : "立即报名"
                              : "请先登录"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {grabMutation.isError ? (
                  <div className="mt-4">
                    <StatePanel
                      tone="danger"
                      title="报名未完成"
                      description={(grabMutation.error as ApiError).message}
                    />
                  </div>
                ) : null}
              </div>

              {sessionStatus === "authenticated" ? (
                <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                  <h3 className="text-lg font-semibold text-ink">我的报名状态</h3>
                  {registrationStatusQuery.isLoading ? (
                    <div className="mt-4">
                      <StatePanel tone="loading" title="正在读取状态" description="请稍候。" />
                    </div>
                  ) : registrationStatusQuery.isError ? (
                    (registrationStatusQuery.error as ApiError).status === 404 ? (
                      <div className="mt-4">
                        <StatePanel title="还没有报名记录" description="提交后会显示在这里。" />
                      </div>
                    ) : (
                      <div className="mt-4">
                        <StatePanel
                          tone="danger"
                          title="状态暂时无法读取"
                          description={(registrationStatusQuery.error as ApiError).message}
                        />
                      </div>
                    )
                  ) : registrationStatusQuery.data ? (
                    <div className="mt-4 rounded-2xl bg-sand px-4 py-4 text-sm text-ink/75">
                      <p className="font-medium text-ink">
                        当前状态：{registrationStateLabel(registrationStatusQuery.data.status)}
                      </p>
                      {registrationStatusQuery.data.orderId ? (
                        <Link
                          to={`/orders/${registrationStatusQuery.data.orderId}`}
                          className="mt-3 inline-flex rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                        >
                          查看订单详情
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </PageSection>
  );
}

function ActivityCard({
  activity,
  active,
  onSelect
}: {
  activity: ActivityListItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-[24px] border px-4 py-4 text-left transition ${
        active ? "border-ember bg-ember/10" : "border-ink/10 bg-white hover:border-moss"
      }`}
      onClick={onSelect}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-moss">
        {statusLabel(activity.status)}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{activity.title}</h3>
      <p className="mt-2 text-sm text-ink/70">{activity.location || "线上/待定"}</p>
    </button>
  );
}

function statusLabel(status: ActivityListItem["status"]) {
  switch (status) {
    case "draft":
      return "草稿";
    case "published":
      return "已发布";
    case "closed":
      return "已关闭";
    case "cancelled":
      return "已取消";
  }
}

function registrationStateLabel(
  status: "pending_confirmation" | "confirmed" | "cancelled" | "no_show" | "queued" | "failed"
) {
  switch (status) {
    case "queued":
      return "排队中";
    case "pending_confirmation":
      return "待确认";
    case "confirmed":
      return "已确认";
    case "cancelled":
      return "已取消";
    case "no_show":
      return "已结束";
    case "failed":
      return "失败";
  }
}

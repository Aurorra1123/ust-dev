import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { ActivityListItem } from "@campusbook/shared-types";

import {
  ApiError,
  fetchActivities,
  fetchActivityDetail,
  fetchActivityRegistrationStatus,
  grabActivity
} from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

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
    enabled:
      !!selectedActivity?.id && sessionStatus === "authenticated",
    refetchInterval: (query) =>
      query.state.data?.status === "queued" ? 2_000 : false
  });

  const grabMutation = useMutation({
    mutationFn: ({ activityId: currentActivityId, ticketId }: { activityId: string; ticketId: string }) =>
      grabActivity(currentActivityId, {
        ticketId
      }),
    onSuccess: async () => {
      await registrationStatusQuery.refetch();
    }
  });

  const soldOut = useMemo(
    () =>
      selectedActivity?.remainingQuota !== undefined &&
      selectedActivity.remainingQuota <= 0,
    [selectedActivity]
  );

  return (
    <>
      <PageHero
        eyebrow="Activity Grab"
        title="活动列表、详情和抢票入口已经接通真实链路"
        description="抢票请求会先打到 Redis 做热点校验和预扣库存，再进入 BullMQ 异步落单。你可以直接在这里触发报名，并看到排队中、已确认或失败状态。"
        aside={
          <>
            <p className="font-medium text-ink">当前公开活动</p>
            <p className="mt-3 text-3xl font-semibold text-ink">
              {activitiesQuery.data?.length ?? 0}
            </p>
            <p className="mt-2 text-sm text-ink/70">
              {sessionStatus === "authenticated"
                ? "已登录，可直接发起抢票。"
                : "未登录时可浏览活动，但无法参与抢票。"}
            </p>
          </>
        }
      />

      <PageSection title="活动与抢票状态">
        {activitiesQuery.isLoading ? (
          <p className="text-sm text-ink/70">正在加载活动列表。</p>
        ) : activitiesQuery.isError ? (
          <p className="text-sm text-ember">
            {(activitiesQuery.error as ApiError).message}
          </p>
        ) : !activitiesQuery.data?.length ? (
          <p className="text-sm text-ink/70">当前没有已发布活动。</p>
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
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">
                    Activity Detail
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">
                    {selectedActivity.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    {selectedActivity.description || "当前活动暂无补充描述。"}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoCard
                      label="开售时间"
                      value={formatDateTime(selectedActivity.saleStartTime)}
                    />
                    <InfoCard
                      label="停售时间"
                      value={formatDateTime(selectedActivity.saleEndTime)}
                    />
                    <InfoCard label="状态" value={statusLabel(selectedActivity.status)} />
                    <InfoCard
                      label="剩余额度"
                      value={`${selectedActivity.remainingQuota}`}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5">
                  <h3 className="text-lg font-semibold text-ink">票种与抢票入口</h3>
                  {detailQuery.isLoading ? (
                    <p className="mt-4 text-sm text-ink/70">正在加载票种详情。</p>
                  ) : detailQuery.isError ? (
                    <p className="mt-4 text-sm text-ember">
                      {(detailQuery.error as ApiError).message}
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {detailQuery.data?.tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-2xl border border-white/70 bg-white px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-ink">
                                {ticket.name}
                              </p>
                              <p className="mt-2 text-sm text-ink/70">
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
                    <div className="mt-4 rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">
                      {(grabMutation.error as ApiError).message}
                    </div>
                  ) : null}
                </div>

                {sessionStatus === "authenticated" ? (
                  <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                    <h3 className="text-lg font-semibold text-ink">我的报名状态</h3>
                    {registrationStatusQuery.isLoading ? (
                      <p className="mt-4 text-sm text-ink/70">正在读取报名状态。</p>
                    ) : registrationStatusQuery.isError ? (
                      (registrationStatusQuery.error as ApiError).status === 404 ? (
                        <p className="mt-4 text-sm text-ink/70">
                          当前还没有该活动的报名记录。
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-ember">
                          {(registrationStatusQuery.error as ApiError).message}
                        </p>
                      )
                    ) : registrationStatusQuery.data ? (
                      <div className="mt-4 rounded-2xl bg-sand px-4 py-4 text-sm text-ink/75">
                        <p className="font-medium text-ink">
                          当前状态：{registrationStateLabel(registrationStatusQuery.data.status)}
                        </p>
                        <p className="mt-2">
                          {registrationStatusQuery.data.orderNo
                            ? `订单号：${registrationStatusQuery.data.orderNo}`
                            : "当前还没有订单号。"}
                        </p>
                        <p className="mt-1">
                          {registrationStatusQuery.data.reason || "暂无失败原因。"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </PageSection>
    </>
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
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink/45">
        剩余额度 {activity.remainingQuota}
      </p>
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
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
      return "已爽约";
    case "failed":
      return "失败";
  }
}

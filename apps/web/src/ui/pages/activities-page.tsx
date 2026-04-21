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
import { getErrorMessage, getErrorStatus } from "../../lib/http/errors";
import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";

export function ActivitiesPage() {
  const locale = useLocaleStore((state) => state.locale);
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
      title={localeText(locale, "校园活动", "Campus Activities")}
      description={localeText(
        locale,
        "选择活动后查看票种并完成报名。",
        "Select an activity, review ticket types, and complete registration."
      )}
    >
      {activitiesQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入活动", "Loading activities")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : activitiesQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "活动暂时无法加载", "Activities are unavailable")}
          description={getErrorMessage(activitiesQuery.error)}
        />
      ) : !activitiesQuery.data?.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有活动", "No activities available")}
          description={localeText(locale, "请稍后刷新。", "Please refresh later.")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px,minmax(0,1fr)]">
          <div className="grid gap-3">
            {activitiesQuery.data.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                active={activity.id === selectedActivity?.id}
                onSelect={() => setActivityId(activity.id)}
                locale={locale}
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
                  {selectedActivity.location ||
                    localeText(locale, "活动地点待补充", "Location to be added")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="brand">
                    {statusLabel(selectedActivity.status, locale)}
                  </StatusPill>
                  <StatusPill tone={soldOut ? "danger" : "success"}>
                    {soldOut
                      ? localeText(locale, "名额紧张", "Limited Seats")
                      : localeText(locale, "可报名", "Available")}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate">
                  {selectedActivity.description ||
                    localeText(locale, "当前活动暂无补充描述。", "No description yet.")}
                </p>
                <p className="mt-3 text-sm text-slate">
                  {localeText(
                    locale,
                    `开售 ${formatDateTime(selectedActivity.saleStartTime)} · 停售 ${formatDateTime(selectedActivity.saleEndTime)}`,
                    `Sales ${formatDateTime(selectedActivity.saleStartTime)} · End ${formatDateTime(selectedActivity.saleEndTime)}`
                  )}
                </p>
              </div>

              <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                <h3 className="text-lg font-semibold text-ink">
                  {localeText(locale, "票种", "Ticket Types")}
                </h3>
                {detailQuery.isLoading ? (
                  <div className="mt-4">
                    <StatePanel
                      tone="loading"
                      title={localeText(locale, "正在载入票种", "Loading ticket types")}
                      description={localeText(locale, "请稍候。", "Please wait.")}
                    />
                  </div>
                ) : detailQuery.isError ? (
                  <div className="mt-4">
                    <StatePanel
                      tone="danger"
                      title={localeText(locale, "票种暂时无法加载", "Ticket types are unavailable")}
                      description={getErrorMessage(detailQuery.error)}
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
                              {localeText(
                                locale,
                                `库存 ${ticket.stock} / 已保留 ${ticket.reserved}`,
                                `Stock ${ticket.stock} / Reserved ${ticket.reserved}`
                              )}
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
                                ? localeText(locale, "提交中", "Submitting")
                                : localeText(locale, "立即报名", "Register Now")
                              : localeText(locale, "请先登录", "Sign In")}
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
                      title={localeText(locale, "报名未完成", "Registration failed")}
                      description={getErrorMessage(grabMutation.error)}
                    />
                  </div>
                ) : null}
              </div>

              {sessionStatus === "authenticated" ? (
                <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                  <h3 className="text-lg font-semibold text-ink">
                    {localeText(locale, "我的报名状态", "My Registration Status")}
                  </h3>
                  {registrationStatusQuery.isLoading ? (
                    <div className="mt-4">
                      <StatePanel
                        tone="loading"
                        title={localeText(locale, "正在读取状态", "Loading status")}
                        description={localeText(locale, "请稍候。", "Please wait.")}
                      />
                    </div>
                  ) : registrationStatusQuery.isError ? (
                    getErrorStatus(registrationStatusQuery.error) === 404 ? (
                      <div className="mt-4">
                        <StatePanel
                          title={localeText(locale, "还没有报名记录", "No registration yet")}
                          description={localeText(
                            locale,
                            "提交后会显示在这里。",
                            "Your registration status will appear here."
                          )}
                        />
                      </div>
                    ) : (
                      <div className="mt-4">
                        <StatePanel
                          tone="danger"
                          title={localeText(locale, "状态暂时无法读取", "Status is unavailable")}
                          description={getErrorMessage(registrationStatusQuery.error)}
                        />
                      </div>
                    )
                  ) : registrationStatusQuery.data ? (
                    <div className="mt-4 rounded-2xl bg-sand px-4 py-4 text-sm text-ink/75">
                      <p className="font-medium text-ink">
                        {localeText(locale, "当前状态：", "Current status: ")}
                        {registrationStateLabel(registrationStatusQuery.data.status, locale)}
                      </p>
                      {registrationStatusQuery.data.orderId ? (
                        <Link
                          to={`/orders/${registrationStatusQuery.data.orderId}`}
                          className="mt-3 inline-flex rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                        >
                          {localeText(locale, "查看订单详情", "View Order Details")}
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
  onSelect,
  locale
}: {
  activity: ActivityListItem;
  active: boolean;
  onSelect: () => void;
  locale: "zh-CN" | "en";
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
        {statusLabel(activity.status, locale)}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{activity.title}</h3>
      <p className="mt-2 text-sm text-ink/70">
        {activity.location || localeText(locale, "线上/待定", "Online / TBD")}
      </p>
    </button>
  );
}

function statusLabel(status: ActivityListItem["status"], locale: "zh-CN" | "en") {
  switch (status) {
    case "draft":
      return localeText(locale, "草稿", "Draft");
    case "published":
      return localeText(locale, "已发布", "Published");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
  }
}

function registrationStateLabel(
  status: "pending_confirmation" | "confirmed" | "cancelled" | "no_show" | "queued" | "failed",
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "queued":
      return localeText(locale, "排队中", "Queued");
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "no_show":
      return localeText(locale, "已结束", "Finished");
    case "failed":
      return localeText(locale, "失败", "Failed");
  }
}

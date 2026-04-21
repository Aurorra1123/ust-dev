import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createActivity,
  createActivityTicket,
  fetchAdminActivities,
  updateActivity
} from "../../../../lib/api/activity-api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../../../lib/date";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { StatePanel, StatusPill } from "../../../user-experience-kit";
import { activityStatusLabel } from "../admin-helpers";
import { AdminInfoCard } from "../components/admin-info-card";
import { MutationState } from "../components/mutation-state";

type ActivityFormState = {
  title: string;
  description: string;
  location: string;
  totalQuota: number;
  saleStartTime: string;
  saleEndTime: string;
  eventStartTime: string;
  eventEndTime: string;
  status: "draft" | "published";
  ticketName: string;
  ticketStock: number;
  priceCents: number;
};

export function ActivitiesWorkspace({ locale: _locale }: { locale: Locale }) {
  const activitiesQuery = useQuery({
    queryKey: ["admin", "activities"],
    queryFn: fetchAdminActivities
  });
  const [activityId, setActivityId] = useState("");
  const [activityForm, setActivityForm] = useState<ActivityFormState>(() => {
    const saleStart = startOfNextHour();
    const saleEnd = addHours(saleStart, 24);
    const eventStart = addHours(saleStart, 26);
    const eventEnd = addHours(eventStart, 2);

    return {
      title: "CampusBook 校园服务说明会",
      description: "由管理后台创建的活动示例，用于验证票种和状态流转。",
      location: "学生活动中心",
      totalQuota: 30,
      saleStartTime: toDateTimeLocalValue(saleStart),
      saleEndTime: toDateTimeLocalValue(saleEnd),
      eventStartTime: toDateTimeLocalValue(eventStart),
      eventEndTime: toDateTimeLocalValue(eventEnd),
      status: "published",
      ticketName: "普通票",
      ticketStock: 20,
      priceCents: 0
    };
  });
  const [ticketForm, setTicketForm] = useState({
    name: "候补票",
    stock: 10,
    priceCents: 0
  });

  useEffect(() => {
    const firstActivity = activitiesQuery.data?.[0];

    if (!activityId && firstActivity) {
      setActivityId(firstActivity.id);
    }
  }, [activityId, activitiesQuery.data]);

  const selectedActivity =
    activitiesQuery.data?.find((activity) => activity.id === activityId) ??
    activitiesQuery.data?.[0] ??
    null;

  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: async (activity) => {
      setActivityId(activity.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload: {
      activityId: string;
      name: string;
      stock: number;
      priceCents: number;
    }) => createActivityTicket(payload.activityId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const publishMutation = useMutation({
    mutationFn: (status: "published" | "closed") =>
      updateActivity(selectedActivity!.id, {
        status
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  return (
    <PageSection
      title="活动工作区"
      description="这里负责活动、票种和活动状态维护。左侧先选活动，中间看当前详情，右侧做创建或加票操作。"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),360px]">
        <div className="grid gap-4">
          {activitiesQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title="正在载入活动工作区"
              description="页面正在整理当前活动、票种与状态信息。"
            />
          ) : activitiesQuery.isError ? (
            <StatePanel
              tone="danger"
              title="活动工作区暂时无法加载"
              description={(activitiesQuery.error as Error).message}
            />
          ) : (
            activitiesQuery.data?.map((activity) => (
              <button
                key={activity.id}
                type="button"
                className={`rounded-[26px] border px-5 py-5 text-left transition ${
                  activity.id === selectedActivity?.id
                    ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                    : "border-ink/10 bg-white hover:border-moss"
                }`}
                onClick={() => setActivityId(activity.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-moss">
                      {activity.status}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">
                      {activity.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/75">
                    {activity.tickets.length} 个票种
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink/70">
                  {formatDateTime(activity.saleStartTime)} -{" "}
                  {formatDateTime(activity.saleEndTime)}
                </p>
              </button>
            ))
          )}

          {selectedActivity ? (
            <div className="overflow-hidden rounded-[26px] border border-navy/10 bg-white">
              <div className="border-b border-navy/10 bg-gradient-to-r from-navy via-[#0d3f82] to-moss px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Selected Activity
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{selectedActivity.title}</h3>
                <p className="mt-2 text-sm text-white/80">
                  {selectedActivity.location || "活动地点待补充"}
                </p>
              </div>
              <div className="px-5 py-5">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="brand">{activityStatusLabel(selectedActivity.status)}</StatusPill>
                  <StatusPill tone="success">{selectedActivity.tickets.length} 个票种</StatusPill>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <AdminInfoCard
                    label="开售时间"
                    value={formatDateTime(selectedActivity.saleStartTime)}
                  />
                  <AdminInfoCard
                    label="停售时间"
                    value={formatDateTime(selectedActivity.saleEndTime)}
                  />
                  <AdminInfoCard
                    label="票种数量"
                    value={String(selectedActivity.tickets.length)}
                  />
                  <AdminInfoCard
                    label="总额度"
                    value={String(selectedActivity.totalQuota)}
                  />
                </div>
                <div className="mt-5 grid gap-3">
                  {selectedActivity.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-2xl border border-navy/10 bg-sand px-4 py-4"
                    >
                      <p className="font-medium text-ink">{ticket.name}</p>
                      <p className="mt-2 text-sm text-slate">
                        库存 {ticket.stock} / 已保留 {ticket.reserved}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <form
            className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              createActivityMutation.mutate({
                title: activityForm.title,
                description: activityForm.description,
                location: activityForm.location,
                totalQuota: activityForm.totalQuota,
                saleStartTime: new Date(activityForm.saleStartTime).toISOString(),
                saleEndTime: new Date(activityForm.saleEndTime).toISOString(),
                eventStartTime: new Date(activityForm.eventStartTime).toISOString(),
                eventEndTime: new Date(activityForm.eventEndTime).toISOString(),
                status: activityForm.status,
                tickets: [
                  {
                    name: activityForm.ticketName,
                    stock: activityForm.ticketStock,
                    priceCents: activityForm.priceCents
                  }
                ]
              });
            }}
          >
            <h3 className="text-lg font-semibold text-ink">新增活动</h3>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={activityForm.title}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    title: event.target.value
                  }))
                }
                placeholder="活动标题"
              />
              <input
                className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={activityForm.location}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    location: event.target.value
                  }))
                }
                placeholder="活动地点"
              />
              <textarea
                className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={activityForm.description}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="活动描述"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="number"
                  min={1}
                  value={activityForm.totalQuota}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      totalQuota: Number(event.target.value)
                    }))
                  }
                  placeholder="总额度"
                />
                <select
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.status}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      status: event.target.value as "draft" | "published"
                    }))
                  }
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="datetime-local"
                  value={activityForm.saleStartTime}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      saleStartTime: event.target.value
                    }))
                  }
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="datetime-local"
                  value={activityForm.saleEndTime}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      saleEndTime: event.target.value
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="datetime-local"
                  value={activityForm.eventStartTime}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      eventStartTime: event.target.value
                    }))
                  }
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="datetime-local"
                  value={activityForm.eventEndTime}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      eventEndTime: event.target.value
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.ticketName}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      ticketName: event.target.value
                    }))
                  }
                  placeholder="首个票种名称"
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="number"
                  min={1}
                  value={activityForm.ticketStock}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      ticketStock: Number(event.target.value)
                    }))
                  }
                  placeholder="票数"
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="number"
                  min={0}
                  value={activityForm.priceCents}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      priceCents: Number(event.target.value)
                    }))
                  }
                  placeholder="价格分"
                />
              </div>
            </div>
            <MutationState mutation={createActivityMutation} success="活动已创建。" />
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={createActivityMutation.isPending}
            >
              {createActivityMutation.isPending ? "创建中" : "创建活动"}
            </button>
          </form>

          <form
            className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedActivity) {
                return;
              }

              createTicketMutation.mutate({
                activityId: selectedActivity.id,
                ...ticketForm
              });
            }}
          >
            <h3 className="text-lg font-semibold text-ink">活动加票与状态切换</h3>
            <p className="mt-2 text-sm text-ink/70">
              当前活动：{selectedActivity?.title || "请先选择左侧活动"}
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={ticketForm.name}
                onChange={(event) =>
                  setTicketForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                placeholder="新增票种名称"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="number"
                  min={1}
                  value={ticketForm.stock}
                  onChange={(event) =>
                    setTicketForm((current) => ({
                      ...current,
                      stock: Number(event.target.value)
                    }))
                  }
                  placeholder="库存"
                />
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  type="number"
                  min={0}
                  value={ticketForm.priceCents}
                  onChange={(event) =>
                    setTicketForm((current) => ({
                      ...current,
                      priceCents: Number(event.target.value)
                    }))
                  }
                  placeholder="价格分"
                />
              </div>
            </div>
            <MutationState mutation={createTicketMutation} success="票种已追加。" />
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
                disabled={!selectedActivity || createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? "提交中" : "新增票种"}
              </button>
              <button
                type="button"
                className="rounded-full border border-ember/25 px-4 py-3 text-sm text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedActivity || publishMutation.isPending}
                onClick={() => publishMutation.mutate("published")}
              >
                发布
              </button>
              <button
                type="button"
                className="rounded-full border border-ink/15 px-4 py-3 text-sm text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedActivity || publishMutation.isPending}
                onClick={() => publishMutation.mutate("closed")}
              >
                关闭
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageSection>
  );
}

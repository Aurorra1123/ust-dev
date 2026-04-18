import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { ResourceType } from "@campusbook/shared-types";

import {
  ApiError,
  createActivity,
  createActivityTicket,
  createResource,
  createResourceUnit,
  fetchAdminActivities,
  fetchAdminResources,
  fetchAdminRules,
  updateActivity
} from "../../lib/api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

type ResourceUnitFormState = {
  code: string;
  name: string;
  unitType: string;
  availabilityMode: "continuous" | "discrete_slot";
  capacity: number;
};

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

export function AdminPage() {
  const resourcesQuery = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: fetchAdminResources
  });
  const activitiesQuery = useQuery({
    queryKey: ["admin", "activities"],
    queryFn: fetchAdminActivities
  });
  const rulesQuery = useQuery({
    queryKey: ["admin", "rules"],
    queryFn: fetchAdminRules
  });

  const [resourceId, setResourceId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [resourceForm, setResourceForm] = useState({
    type: "academic_space" as ResourceType,
    code: "res_admin_demo_new",
    name: "创新协作室",
    description: "管理端创建的演示资源",
    location: "A 栋 4 楼",
    status: "active" as const
  });
  const [resourceUnitForm, setResourceUnitForm] = useState<ResourceUnitFormState>({
    code: "unit_admin_demo_new",
    name: "协作席位 A",
    unitType: "room",
    availabilityMode: "continuous",
    capacity: 8
  });
  const [activityForm, setActivityForm] = useState<ActivityFormState>(() => {
    const saleStart = startOfNextHour();
    const saleEnd = addHours(saleStart, 24);
    const eventStart = addHours(saleStart, 26);
    const eventEnd = addHours(eventStart, 2);

    return {
      title: "CampusBook 管理后台演示活动",
      description: "由管理后台直接创建的演示活动。",
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
    const firstResource = resourcesQuery.data?.[0];

    if (!resourceId && firstResource) {
      setResourceId(firstResource.id);
    }
  }, [resourceId, resourcesQuery.data]);

  useEffect(() => {
    const firstActivity = activitiesQuery.data?.[0];

    if (!activityId && firstActivity) {
      setActivityId(firstActivity.id);
    }
  }, [activityId, activitiesQuery.data]);

  const selectedResource =
    resourcesQuery.data?.find((resource) => resource.id === resourceId) ??
    resourcesQuery.data?.[0] ??
    null;
  const selectedActivity =
    activitiesQuery.data?.find((activity) => activity.id === activityId) ??
    activitiesQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setResourceUnitForm((current) => ({
      ...current,
      availabilityMode:
        selectedResource.type === "academic_space"
          ? "continuous"
          : "discrete_slot",
      unitType:
        selectedResource.type === "academic_space" ? "room" : "court"
    }));
  }, [selectedResource]);

  const createResourceMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async (resource) => {
      setResourceId(resource.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const createResourceUnitMutation = useMutation({
    mutationFn: (payload: {
      resourceId: string;
      code: string;
      name: string;
      unitType: string;
      availabilityMode: "continuous" | "discrete_slot";
      capacity: number;
    }) => createResourceUnit(payload.resourceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "resources"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

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
      updateActivity(activityId, {
        status
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] })
      ]);
    }
  });

  const resourceStats = useMemo(
    () => ({
      resourceCount: resourcesQuery.data?.length ?? 0,
      unitCount:
        resourcesQuery.data?.reduce((total, resource) => total + resource.units.length, 0) ?? 0
    }),
    [resourcesQuery.data]
  );

  return (
    <>
      <PageHero
        eyebrow="Admin Console"
        title="管理端已经具备资源和活动的最小维护能力"
        description="当前后台可以直接创建资源、补资源单元、创建活动、追加票种并切换活动状态。前台页面会实时复用这些真实数据。"
        aside={
          <>
            <p className="font-medium text-ink">当前站点概览</p>
            <p className="mt-3 text-sm text-ink/75">
              资源 {resourceStats.resourceCount} 个 / 单元 {resourceStats.unitCount} 个
            </p>
            <p className="mt-2 text-sm text-ink/75">
              活动 {activitiesQuery.data?.length ?? 0} 个 / 规则 {rulesQuery.data?.length ?? 0} 条
            </p>
          </>
        }
      />

      <PageSection title="资源维护">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),340px]">
          <div className="grid gap-4">
            {resourcesQuery.isLoading ? (
              <p className="text-sm text-ink/70">正在加载资源。</p>
            ) : resourcesQuery.isError ? (
              <p className="text-sm text-ember">
                {(resourcesQuery.error as ApiError).message}
              </p>
            ) : (
              resourcesQuery.data?.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    resource.id === selectedResource?.id
                      ? "border-ember bg-ember/10"
                      : "border-ink/10 bg-white hover:border-moss"
                  }`}
                  onClick={() => setResourceId(resource.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-moss">
                        {resource.type === "academic_space" ? "Academic" : "Sports"}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-ink">
                        {resource.name}
                      </h3>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/75">
                      {resource.status === "active" ? "启用中" : "已停用"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink/70">
                    {resource.location || "未填写位置"} · {resource.units.length} 个单元
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="grid gap-4">
            <form
              className="rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                createResourceMutation.mutate(resourceForm);
              }}
            >
              <h3 className="text-lg font-semibold text-ink">新增资源</h3>
              <div className="mt-4 grid gap-3">
                <select
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceForm.type}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      type: event.target.value as ResourceType
                    }))
                  }
                >
                  <option value="academic_space">学术空间</option>
                  <option value="sports_facility">体育设施</option>
                </select>
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceForm.code}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      code: event.target.value
                    }))
                  }
                  placeholder="资源编码"
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceForm.name}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="资源名称"
                />
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceForm.location}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      location: event.target.value
                    }))
                  }
                  placeholder="位置"
                />
                <textarea
                  className="min-h-[96px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceForm.description}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder="描述"
                />
              </div>
              <MutationState mutation={createResourceMutation} success="资源已创建。" />
              <button
                type="submit"
                className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                disabled={createResourceMutation.isPending}
              >
                {createResourceMutation.isPending ? "创建中" : "创建资源"}
              </button>
            </form>

            <form
              className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedResource) {
                  return;
                }

                createResourceUnitMutation.mutate({
                  resourceId: selectedResource.id,
                  ...resourceUnitForm
                });
              }}
            >
              <h3 className="text-lg font-semibold text-ink">新增资源单元</h3>
              <p className="mt-2 text-sm text-ink/70">
                当前资源：{selectedResource?.name || "请先选择左侧资源"}
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceUnitForm.code}
                  onChange={(event) =>
                    setResourceUnitForm((current) => ({
                      ...current,
                      code: event.target.value
                    }))
                  }
                  placeholder="单元编码"
                />
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceUnitForm.name}
                  onChange={(event) =>
                    setResourceUnitForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="单元名称"
                />
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={resourceUnitForm.unitType}
                  onChange={(event) =>
                    setResourceUnitForm((current) => ({
                      ...current,
                      unitType: event.target.value
                    }))
                  }
                  placeholder="单元类型"
                />
              </div>
              <MutationState mutation={createResourceUnitMutation} success="资源单元已创建。" />
              <button
                type="submit"
                className="mt-4 w-full rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
                disabled={!selectedResource || createResourceUnitMutation.isPending}
              >
                {createResourceUnitMutation.isPending ? "创建中" : "创建资源单元"}
              </button>
            </form>
          </div>
        </div>
      </PageSection>

      <PageSection title="活动维护">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),360px]">
          <div className="grid gap-4">
            {activitiesQuery.isLoading ? (
              <p className="text-sm text-ink/70">正在加载活动。</p>
            ) : activitiesQuery.isError ? (
              <p className="text-sm text-ember">
                {(activitiesQuery.error as ApiError).message}
              </p>
            ) : (
              activitiesQuery.data?.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    activity.id === selectedActivity?.id
                      ? "border-ember bg-ember/10"
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

      <PageSection title="规则快照">
        {rulesQuery.isLoading ? (
          <p className="text-sm text-ink/70">正在加载规则配置。</p>
        ) : rulesQuery.isError ? (
          <p className="text-sm text-ember">
            {(rulesQuery.error as ApiError).message}
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {rulesQuery.data?.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-moss">
                  {rule.ruleType}
                </p>
                <p className="mt-2 text-base font-semibold text-ink">
                  {rule.name}
                </p>
                <p className="mt-2 text-sm text-ink/70">
                  绑定资源：{rule.resourceIds.length || 0}
                </p>
                <pre className="mt-3 overflow-x-auto text-xs text-ink/60">
                  {JSON.stringify(rule.expression, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}

function MutationState({
  mutation,
  success
}: {
  mutation: {
    isError: boolean;
    error: unknown;
    isSuccess: boolean;
  };
  success: string;
}) {
  if (mutation.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">
        {(mutation.error as ApiError).message}
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="mt-4 rounded-2xl border border-moss/20 bg-white px-4 py-3 text-sm text-ink/75">
        {success}
      </div>
    );
  }

  return null;
}

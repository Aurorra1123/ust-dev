import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createActivity,
  createActivityTicket,
  fetchAdminActivities,
  updateActivity
} from "../../../../lib/api/activity-api";
import { addHours, formatDateTime, startOfNextHour, toDateTimeLocalValue } from "../../../../lib/date";
import { getErrorMessage } from "../../../../lib/http/errors";
import { localeText } from "../../../../lib/locale";
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
};

type FirstTicketFormState = {
  name: string;
  stock: number;
  priceCents: number;
};

function createDefaultActivityForm(): ActivityFormState {
  const saleStart = startOfNextHour();
  const saleEnd = addHours(saleStart, 24);
  const eventStart = addHours(saleStart, 26);
  const eventEnd = addHours(eventStart, 2);

  return {
    title: "",
    description: "",
    location: "",
    totalQuota: 30,
    saleStartTime: toDateTimeLocalValue(saleStart),
    saleEndTime: toDateTimeLocalValue(saleEnd),
    eventStartTime: toDateTimeLocalValue(eventStart),
    eventEndTime: toDateTimeLocalValue(eventEnd),
    status: "draft"
  };
}

function defaultFirstTicketName(locale: Locale) {
  return localeText(locale, "普通票", "General Ticket");
}

function createDefaultFirstTicketForm(totalQuota: number, locale: Locale): FirstTicketFormState {
  return {
    name: defaultFirstTicketName(locale),
    stock: totalQuota,
    priceCents: 0
  };
}

export function ActivitiesWorkspace({ locale }: { locale: Locale }) {
  const activitiesQuery = useQuery({
    queryKey: ["admin", "activities"],
    queryFn: fetchAdminActivities
  });
  const [activityId, setActivityId] = useState("");
  const [activityForm, setActivityForm] = useState<ActivityFormState>(createDefaultActivityForm);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customizeFirstTicket, setCustomizeFirstTicket] = useState(false);
  const [firstTicketForm, setFirstTicketForm] = useState<FirstTicketFormState>(() =>
    createDefaultFirstTicketForm(createDefaultActivityForm().totalQuota, locale)
  );
  const [ticketForm, setTicketForm] = useState({
    name: "",
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
  const effectiveFirstTicket = customizeFirstTicket
    ? firstTicketForm
    : createDefaultFirstTicketForm(activityForm.totalQuota, locale);
  const isCreateActivityValid =
    activityForm.title.trim().length > 0 &&
    activityForm.totalQuota > 0 &&
    effectiveFirstTicket.name.trim().length > 0 &&
    effectiveFirstTicket.stock > 0 &&
    effectiveFirstTicket.priceCents >= 0;
  const isCreateTicketValid =
    Boolean(selectedActivity) &&
    ticketForm.name.trim().length > 0 &&
    ticketForm.stock > 0 &&
    ticketForm.priceCents >= 0;

  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: async (activity) => {
      const defaultActivityForm = createDefaultActivityForm();

      setActivityId(activity.id);
      setActivityForm(defaultActivityForm);
      setShowAdvancedSettings(false);
      setCustomizeFirstTicket(false);
      setFirstTicketForm(createDefaultFirstTicketForm(defaultActivityForm.totalQuota, locale));
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
      title={localeText(locale, "活动管理", "Activity Management")}
      description={localeText(
        locale,
        "查看活动列表，维护活动信息、票种和发布状态。",
        "Review activities and maintain their details, ticket types, and publishing status."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),360px]">
        <div className="grid gap-4">
          {activitiesQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title={localeText(locale, "正在载入活动管理", "Loading activity management")}
              description={localeText(
                locale,
                "正在载入活动和票种信息。",
                "Loading activities and ticket information."
              )}
            />
          ) : activitiesQuery.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "活动管理暂时无法加载", "Activity management is unavailable")}
              description={getErrorMessage(activitiesQuery.error)}
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
                      {activityStatusLabel(activity.status, locale)}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">
                      {activity.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs text-ink/75">
                    {localeText(
                      locale,
                      `${activity.tickets.length} 个票种`,
                      `${activity.tickets.length} ticket types`
                    )}
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
                  {localeText(locale, "当前活动", "Selected Activity")}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{selectedActivity.title}</h3>
                <p className="mt-2 text-sm text-white/80">
                  {selectedActivity.location ||
                    localeText(locale, "活动地点待补充", "Location to be added")}
                </p>
              </div>
              <div className="px-5 py-5">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="brand">
                    {activityStatusLabel(selectedActivity.status, locale)}
                  </StatusPill>
                  <StatusPill tone="success">
                    {localeText(
                      locale,
                      `${selectedActivity.tickets.length} 个票种`,
                      `${selectedActivity.tickets.length} ticket types`
                    )}
                  </StatusPill>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <AdminInfoCard
                    label={localeText(locale, "开售时间", "Sales Start")}
                    value={formatDateTime(selectedActivity.saleStartTime)}
                  />
                  <AdminInfoCard
                    label={localeText(locale, "停售时间", "Sales End")}
                    value={formatDateTime(selectedActivity.saleEndTime)}
                  />
                  <AdminInfoCard
                    label={localeText(locale, "票种数量", "Ticket Types")}
                    value={String(selectedActivity.tickets.length)}
                  />
                  <AdminInfoCard
                    label={localeText(locale, "总额度", "Total Quota")}
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
                        {localeText(
                          locale,
                          `库存 ${ticket.stock} / 已保留 ${ticket.reserved}`,
                          `Stock ${ticket.stock} / Reserved ${ticket.reserved}`
                        )}
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
                description: activityForm.description.trim() || undefined,
                location: activityForm.location.trim() || undefined,
                totalQuota: activityForm.totalQuota,
                saleStartTime: new Date(activityForm.saleStartTime).toISOString(),
                saleEndTime: new Date(activityForm.saleEndTime).toISOString(),
                eventStartTime: new Date(activityForm.eventStartTime).toISOString(),
                eventEndTime: new Date(activityForm.eventEndTime).toISOString(),
                status: activityForm.status,
                tickets: [
                  {
                    name: effectiveFirstTicket.name.trim(),
                    stock: effectiveFirstTicket.stock,
                    priceCents: effectiveFirstTicket.priceCents
                  }
                ]
              });
            }}
          >
            <h3 className="text-lg font-semibold text-ink">
              {localeText(locale, "新增活动", "Create Activity")}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate">
              {localeText(
                locale,
                "填写活动名称、地点和额度后即可创建活动，也可以继续补充票种和时间安排。",
                "Start with the activity title, location, and quota, then continue with ticket and schedule details."
              )}
            </p>
            <div className="mt-4 grid gap-4">
              <FieldBlock
                label={localeText(locale, "活动标题", "Activity Title")}
                hint={localeText(
                  locale,
                  "标题是列表和详情页里最先被看到的信息，建议直接表达活动主题。",
                  "The title is the first thing shown in both the list and details, so make the activity topic immediately clear."
                )}
              >
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.title}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                  placeholder={localeText(locale, "活动标题", "Activity title")}
                />
              </FieldBlock>
              <FieldBlock
                label={localeText(locale, "活动地点", "Location")}
                hint={localeText(
                  locale,
                  "地点建议写到学生能直接找到的粒度，例如教学楼房间、球场区域或报告厅名称。",
                  "Use a student-facing location such as a room, court area, or auditorium name."
                )}
              >
                <input
                  className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={activityForm.location}
                  onChange={(event) =>
                    setActivityForm((current) => ({
                      ...current,
                      location: event.target.value
                    }))
                  }
                  placeholder={localeText(locale, "活动地点", "Location")}
                />
              </FieldBlock>
              <FieldBlock
                label={localeText(locale, "总额度", "Total Quota")}
                hint={localeText(
                  locale,
                  "总额度决定默认首票库存，也影响活动详情页展示。若只是单票活动，通常可以与首票库存保持一致。",
                  "The total quota determines the default first-ticket stock and is shown on the activity details page. For a single-ticket activity, it usually matches the first ticket stock."
                )}
              >
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
                  placeholder={localeText(locale, "总额度", "Total quota")}
                />
              </FieldBlock>
              <div className="rounded-[22px] border border-navy/10 bg-white px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {localeText(locale, "默认首个票种", "Default First Ticket")}
                    </p>
                    <p className="mt-2 text-sm text-slate">
                      {localeText(
                        locale,
                        `${effectiveFirstTicket.name} · 库存 ${effectiveFirstTicket.stock} · 免费`,
                        `${effectiveFirstTicket.name} · Stock ${effectiveFirstTicket.stock} · Free`
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
                    onClick={() => {
                      setCustomizeFirstTicket((current) => {
                        const next = !current;

                        if (next) {
                          setFirstTicketForm(
                            createDefaultFirstTicketForm(activityForm.totalQuota, locale)
                          );
                        }

                        return next;
                      });
                    }}
                  >
                    {customizeFirstTicket
                      ? localeText(locale, "恢复默认票种", "Use Default Ticket")
                      : localeText(locale, "自定义首个票种", "Customize First Ticket")}
                  </button>
                </div>

                {customizeFirstTicket ? (
                  <div className="mt-4 grid gap-4">
                    <FieldBlock
                      label={localeText(locale, "首个票种名称", "First Ticket Name")}
                      hint={localeText(
                        locale,
                        "名称会直接展示给学生，建议写成“普通票”“入场票”等能直接理解的叫法。",
                        "This name is shown directly to students, so prefer clear labels such as General Ticket or Entry Ticket."
                      )}
                    >
                      <input
                        className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                        value={firstTicketForm.name}
                        onChange={(event) =>
                          setFirstTicketForm((current) => ({
                            ...current,
                            name: event.target.value
                          }))
                        }
                        placeholder={localeText(locale, "首个票种名称", "First ticket type")}
                      />
                    </FieldBlock>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldBlock
                        label={localeText(locale, "首票库存", "First Ticket Stock")}
                        hint={localeText(
                          locale,
                          "库存决定第一张票能卖多少张，若不需要分票种，通常与总额度保持一致。",
                          "This determines how many tickets the first ticket type can sell. If you do not split types, it usually matches the total quota."
                        )}
                      >
                        <input
                          className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                          type="number"
                          min={1}
                          value={firstTicketForm.stock}
                          onChange={(event) =>
                            setFirstTicketForm((current) => ({
                              ...current,
                              stock: Number(event.target.value)
                            }))
                          }
                          placeholder={localeText(locale, "票数", "Ticket stock")}
                        />
                      </FieldBlock>
                      <FieldBlock
                        label={localeText(locale, "首票价格（分）", "First Ticket Price (cents)")}
                        hint={localeText(
                          locale,
                          "价格字段以分为单位，`0` 表示免费票。",
                          "The price is stored in cents, and `0` means the ticket is free."
                        )}
                      >
                        <input
                          className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                          type="number"
                          min={0}
                          value={firstTicketForm.priceCents}
                          onChange={(event) =>
                            setFirstTicketForm((current) => ({
                              ...current,
                              priceCents: Number(event.target.value)
                            }))
                          }
                          placeholder={localeText(locale, "价格分", "Price in cents")}
                        />
                      </FieldBlock>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="rounded-[22px] border border-navy/10 bg-white px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {localeText(locale, "进阶设置", "Advanced Settings")}
                    </p>
                    <p className="mt-2 text-sm text-slate">
                      {localeText(
                        locale,
                        "可继续补充描述、售卖时间、活动时间和发布状态。",
                        "Use this section for description, schedule, event time, and publish status."
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
                    onClick={() => setShowAdvancedSettings((current) => !current)}
                    aria-expanded={showAdvancedSettings}
                  >
                    {showAdvancedSettings
                      ? localeText(locale, "收起进阶设置", "Hide Advanced Settings")
                      : localeText(locale, "展开进阶设置", "Show Advanced Settings")}
                  </button>
                </div>

                {showAdvancedSettings ? (
                  <div className="mt-4 grid gap-4">
                    <FieldBlock
                      label={localeText(locale, "活动描述", "Description")}
                      hint={localeText(
                        locale,
                        "描述适合补充议程、适用对象、注意事项或报名说明。",
                        "Use the description for agenda, target audience, notes, or registration guidance."
                      )}
                    >
                      <textarea
                        className="min-h-[96px] rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                        value={activityForm.description}
                        onChange={(event) =>
                          setActivityForm((current) => ({
                            ...current,
                            description: event.target.value
                          }))
                        }
                        placeholder={localeText(locale, "活动描述", "Description")}
                      />
                    </FieldBlock>
                    <FieldBlock
                      label={localeText(locale, "发布状态", "Publish Status")}
                      hint={localeText(
                        locale,
                        "默认保持草稿更安全；确认信息完整后再直接创建为已发布状态。",
                        "Keeping the activity as a draft is safer by default. Publish only after the core information is complete."
                      )}
                    >
                      <select
                        className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                        value={activityForm.status}
                        onChange={(event) =>
                          setActivityForm((current) => ({
                            ...current,
                            status: event.target.value as "draft" | "published"
                          }))
                        }
                      >
                        <option value="draft">{localeText(locale, "草稿", "Draft")}</option>
                        <option value="published">{localeText(locale, "已发布", "Published")}</option>
                      </select>
                    </FieldBlock>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldBlock
                        label={localeText(locale, "售卖开始时间", "Sales Start Time")}
                        hint={localeText(
                          locale,
                          "这是学生最早可以开始抢票或报名的时间。",
                          "This is the earliest time when students can start buying or registering."
                        )}
                      >
                        <input
                          className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                          type="datetime-local"
                          value={activityForm.saleStartTime}
                          onChange={(event) =>
                            setActivityForm((current) => ({
                              ...current,
                              saleStartTime: event.target.value
                            }))
                          }
                        />
                      </FieldBlock>
                      <FieldBlock
                        label={localeText(locale, "售卖结束时间", "Sales End Time")}
                        hint={localeText(
                          locale,
                          "超过这个时间后，前端不应继续允许学生下单。",
                          "Students should no longer be able to place orders after this time."
                        )}
                      >
                        <input
                          className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                          type="datetime-local"
                          value={activityForm.saleEndTime}
                          onChange={(event) =>
                            setActivityForm((current) => ({
                              ...current,
                              saleEndTime: event.target.value
                            }))
                          }
                        />
                      </FieldBlock>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldBlock
                        label={localeText(locale, "活动开始时间", "Event Start Time")}
                        hint={localeText(
                          locale,
                          "用于告诉学生活动何时正式开始，也影响详情页的时间展示。",
                          "This tells students when the activity starts and affects the detail page schedule display."
                        )}
                      >
                        <input
                          className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                          type="datetime-local"
                          value={activityForm.eventStartTime}
                          onChange={(event) =>
                            setActivityForm((current) => ({
                              ...current,
                              eventStartTime: event.target.value
                            }))
                          }
                        />
                      </FieldBlock>
                      <FieldBlock
                        label={localeText(locale, "活动结束时间", "Event End Time")}
                        hint={localeText(
                          locale,
                          "用于形成完整活动时间范围，便于后续通知、详情和回溯展示。",
                          "This completes the activity time range for notices, details, and historical review."
                        )}
                      >
                        <input
                          className="rounded-2xl border border-white/70 bg-mist px-4 py-3 text-sm outline-none transition focus:border-moss"
                          type="datetime-local"
                          value={activityForm.eventEndTime}
                          onChange={(event) =>
                            setActivityForm((current) => ({
                              ...current,
                              eventEndTime: event.target.value
                            }))
                          }
                        />
                      </FieldBlock>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <MutationState
              mutation={createActivityMutation}
              success={localeText(locale, "活动已创建。", "Activity created.")}
            />
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
              disabled={!isCreateActivityValid || createActivityMutation.isPending}
            >
              {createActivityMutation.isPending
                ? localeText(locale, "创建中", "Creating")
                : localeText(locale, "创建活动", "Create Activity")}
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
            <h3 className="text-lg font-semibold text-ink">
              {localeText(locale, "活动加票与状态切换", "Ticketing and Status")}
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              {localeText(locale, "当前活动：", "Current activity: ")}
              {selectedActivity?.title ||
                localeText(locale, "请先选择左侧活动", "Select an activity from the left")}
            </p>
            <div className="mt-4 grid gap-4">
              <FieldBlock
                label={localeText(locale, "新增票种名称", "New Ticket Type")}
                hint={localeText(
                  locale,
                  "只有确实需要分档售卖时再新增票种，名称会直接展示在学生端。",
                  "Add another ticket type only when you really need tiered sales. The name is shown directly to students."
                )}
              >
                <input
                  className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                  value={ticketForm.name}
                  onChange={(event) =>
                    setTicketForm((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder={localeText(locale, "新增票种名称", "New ticket type")}
                />
              </FieldBlock>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldBlock
                  label={localeText(locale, "库存", "Stock")}
                  hint={localeText(
                    locale,
                    "库存表示这个票种最多还能售卖多少张，不应超过实际可分配额度。",
                    "Stock is the maximum number of tickets this type can still sell and should not exceed the real allocatable quota."
                  )}
                >
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
                    placeholder={localeText(locale, "库存", "Stock")}
                  />
                </FieldBlock>
                <FieldBlock
                  label={localeText(locale, "票价（分）", "Ticket Price (cents)")}
                  hint={localeText(
                    locale,
                    "价格字段统一用分存储，`0` 代表免费票。",
                    "Ticket prices are stored in cents, and `0` means the ticket is free."
                  )}
                >
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
                    placeholder={localeText(locale, "价格分", "Price in cents")}
                  />
                </FieldBlock>
              </div>
            </div>
            <MutationState
              mutation={createTicketMutation}
              success={localeText(locale, "票种已追加。", "Ticket type added.")}
              pending={localeText(locale, "正在追加票种。", "Adding ticket type.")}
            />
            <MutationState
              mutation={publishMutation}
              success={localeText(locale, "活动状态已更新。", "Activity status updated.")}
              pending={localeText(locale, "正在更新活动状态。", "Updating activity status.")}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:bg-moss/50"
                disabled={!isCreateTicketValid || createTicketMutation.isPending}
              >
                {createTicketMutation.isPending
                  ? localeText(locale, "提交中", "Submitting")
                  : localeText(locale, "新增票种", "Add Ticket Type")}
              </button>
              <button
                type="button"
                className="rounded-full border border-ember/25 px-4 py-3 text-sm text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedActivity || publishMutation.isPending}
                onClick={() => publishMutation.mutate("published")}
              >
                {localeText(locale, "发布", "Publish")}
              </button>
              <button
                type="button"
                className="rounded-full border border-ink/15 px-4 py-3 text-sm text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedActivity || publishMutation.isPending}
                onClick={() => {
                  if (
                    !window.confirm(
                      localeText(
                        locale,
                        "关闭后活动将停止对外售卖。确认继续吗？",
                        "Closing the activity will stop ticket sales. Continue?"
                      )
                    )
                  ) {
                    return;
                  }

                  publishMutation.mutate("closed");
                }}
              >
                {localeText(locale, "关闭", "Close")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageSection>
  );
}

function FieldBlock({
  label,
  hint,
  children
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs leading-6 text-slate">{hint}</p>
      </div>
      {children}
    </div>
  );
}

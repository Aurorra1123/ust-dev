import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createNotification,
  fetchAdminNotifications,
  updateNotification
} from "../../../../lib/api/notification-api";
import { formatDateTime } from "../../../../lib/date";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../../../user-experience-kit";
import { notificationStatusLabel } from "../admin-helpers";
import { MutationState } from "../components/mutation-state";

type NotificationFormState = {
  title: string;
  summary: string;
  imageUrl: string;
  content: string;
  status: "draft" | "published";
};

function createEmptyNotificationForm(): NotificationFormState {
  return {
    title: "",
    summary: "",
    imageUrl: "",
    content: "",
    status: "draft"
  };
}

export function NotificationsWorkspace({ locale }: { locale: Locale }) {
  const notificationsQuery = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: fetchAdminNotifications
  });
  const [selectedId, setSelectedId] = useState("");
  const [editForm, setEditForm] = useState<NotificationFormState>(createEmptyNotificationForm);
  const [createForm, setCreateForm] = useState<NotificationFormState>(createEmptyNotificationForm);

  useEffect(() => {
    const firstNotification = notificationsQuery.data?.[0];

    if (!selectedId && firstNotification) {
      setSelectedId(firstNotification.id);
    }
  }, [notificationsQuery.data, selectedId]);

  const selectedNotification =
    notificationsQuery.data?.find((notification) => notification.id === selectedId) ??
    notificationsQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (!selectedNotification) {
      return;
    }

    setEditForm({
      title: selectedNotification.title,
      summary: selectedNotification.summary ?? "",
      imageUrl: selectedNotification.imageUrl ?? "",
      content: selectedNotification.content,
      status: selectedNotification.status
    });
  }, [selectedNotification]);

  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: async (notification) => {
      setSelectedId(notification.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", "published"] })
      ]);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      notificationId: string;
      title: string;
      summary: string;
      imageUrl: string;
      content: string;
      status: "draft" | "published";
    }) =>
      updateNotification(payload.notificationId, {
        title: payload.title,
        summary: payload.summary,
        imageUrl: payload.imageUrl,
        content: payload.content,
        status: payload.status
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", "published"] })
      ]);
    }
  });

  return (
    <PageSection
      title={localeText(locale, "通知工作区", "Notification Workspace")}
      description={localeText(
        locale,
        "这里负责编辑和发布学生首页通知，学生端与管理员端共用同一条数据链路。",
        "Create and publish homepage notices here. The student and admin views share the same data source."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),380px]">
        <div className="grid gap-4">
          {notificationsQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title={localeText(locale, "正在载入通知工作区", "Loading notification workspace")}
              description={localeText(locale, "请稍候。", "Please wait.")}
            />
          ) : notificationsQuery.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "通知工作区暂时无法加载", "Notification workspace is unavailable")}
              description={(notificationsQuery.error as Error).message}
            />
          ) : !notificationsQuery.data?.length ? (
            <EmptyPanel
              title={localeText(locale, "当前还没有通知", "No notices yet")}
              description={localeText(
                locale,
                "可以直接在右侧创建并发布第一条通知。",
                "Create and publish the first notice from the right panel."
              )}
            />
          ) : (
            notificationsQuery.data.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                  notification.id === selectedNotification?.id
                    ? "border-ember bg-ember/10"
                    : "border-ink/10 bg-white hover:border-moss"
                }`}
                onClick={() => setSelectedId(notification.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{notification.title}</h3>
                    <p className="mt-2 text-sm text-slate">
                      {notification.summary || notification.content}
                    </p>
                  </div>
                  <StatusPill
                    tone={notification.status === "published" ? "success" : "brand"}
                  >
                    {notificationStatusLabel(notification.status, locale)}
                  </StatusPill>
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink/45">
                  {notification.publishedAt
                    ? formatDateTime(notification.publishedAt)
                    : localeText(locale, "待发布", "Draft")}
                </p>
                {notification.imageUrl ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-moss">
                    {localeText(locale, "含图片", "With image")}
                  </p>
                ) : null}
              </button>
            ))
          )}

          {selectedNotification ? (
            <form
              className="rounded-[24px] border border-navy/10 bg-white px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate({
                  notificationId: selectedNotification.id,
                  ...editForm
                });
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">
                    {localeText(locale, "当前编辑", "Editing")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">
                    {selectedNotification.title}
                  </h3>
                </div>
                <StatusPill tone={editForm.status === "published" ? "success" : "brand"}>
                  {notificationStatusLabel(editForm.status, locale)}
                </StatusPill>
              </div>

              <NotificationFormFields
                locale={locale}
                form={editForm}
                tone="sand"
                onChange={setEditForm}
              />

              <MutationState
                mutation={updateMutation}
                success={localeText(locale, "通知已更新。", "Notification updated.")}
              />

              <button
                type="submit"
                className="mt-4 rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                disabled={
                  updateMutation.isPending ||
                  !editForm.title.trim() ||
                  !editForm.content.trim()
                }
              >
                {updateMutation.isPending
                  ? localeText(locale, "保存中", "Saving")
                  : localeText(locale, "保存当前通知", "Save Current Notice")}
              </button>
            </form>
          ) : null}
        </div>

        <form
          className="grid gap-3 rounded-[24px] border border-ink/10 bg-mist px-5 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(createForm);
          }}
        >
          <h3 className="text-lg font-semibold text-ink">
            {localeText(locale, "新建通知", "Create Notification")}
          </h3>
          <NotificationFormFields
            locale={locale}
            form={createForm}
            tone="white"
            publishLabel={localeText(locale, "直接发布", "Publish Now")}
            onChange={setCreateForm}
          />

          <MutationState
            mutation={createMutation}
            success={localeText(locale, "通知已创建。", "Notification created.")}
          />

          <button
            type="submit"
            className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
            disabled={
              createMutation.isPending ||
              !createForm.title.trim() ||
              !createForm.content.trim()
            }
          >
            {createMutation.isPending
              ? localeText(locale, "创建中", "Creating")
              : localeText(locale, "创建通知", "Create Notification")}
          </button>
        </form>
      </div>
    </PageSection>
  );
}

function NotificationFormFields({
  form,
  locale,
  onChange,
  publishLabel,
  tone
}: {
  form: NotificationFormState;
  locale: Locale;
  onChange: Dispatch<SetStateAction<NotificationFormState>>;
  publishLabel?: string;
  tone: "sand" | "white";
}) {
  const fieldClassName =
    tone === "sand"
      ? "rounded-2xl border border-navy/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
      : "rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss";

  return (
    <div className="mt-4 grid gap-3">
      <input
        className={fieldClassName}
        value={form.title}
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            title: event.target.value
          }))
        }
        placeholder={localeText(locale, "通知标题", "Title")}
      />
      <input
        className={fieldClassName}
        value={form.summary}
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            summary: event.target.value
          }))
        }
        placeholder={localeText(locale, "通知摘要", "Summary")}
      />
      <input
        className={fieldClassName}
        value={form.imageUrl}
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            imageUrl: event.target.value
          }))
        }
        placeholder={localeText(locale, "图片链接（可选）", "Image URL (optional)")}
      />
      {form.imageUrl.trim() ? (
        <div className="overflow-hidden rounded-[20px] border border-navy/10 bg-white">
          <img
            src={form.imageUrl}
            alt={form.title || localeText(locale, "通知图片预览", "Notice image preview")}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <textarea
        className={`min-h-[160px] ${fieldClassName}`}
        value={form.content}
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            content: event.target.value
          }))
        }
        placeholder={localeText(locale, "通知正文", "Content")}
      />
      <select
        className={fieldClassName}
        value={form.status}
        onChange={(event) =>
          onChange((current) => ({
            ...current,
            status: event.target.value as "draft" | "published"
          }))
        }
      >
        <option value="draft">{localeText(locale, "草稿", "Draft")}</option>
        <option value="published">
          {publishLabel ?? localeText(locale, "发布", "Publish")}
        </option>
      </select>
    </div>
  );
}

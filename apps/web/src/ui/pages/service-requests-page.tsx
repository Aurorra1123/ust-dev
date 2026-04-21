import { useMutation, useQuery } from "@tanstack/react-query";

import { useState } from "react";

import {
  createServiceRequest,
  fetchMyServiceRequests
} from "../../lib/api/service-request-api";
import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";

export function ServiceRequestsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const requestsQuery = useQuery({
    queryKey: ["service-requests", "mine"],
    queryFn: fetchMyServiceRequests
  });
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: ""
  });

  const createMutation = useMutation({
    mutationFn: createServiceRequest,
    onSuccess: async () => {
      setForm({
        title: "",
        location: "",
        description: ""
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["service-requests", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "service-requests"] })
      ]);
    }
  });

  return (
    <PageSection
      title={localeText(locale, "报修工单", "Service Requests")}
      description={localeText(
        locale,
        "提交事故或设备报修内容，并跟踪管理员当前处理状态。",
        "Submit incidents or repair issues and track the admin status."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[360px,minmax(0,1fr)]">
        <form
          className="grid gap-3 rounded-[24px] border border-navy/10 bg-mist px-5 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <h3 className="text-lg font-semibold text-ink">
            {localeText(locale, "提交新工单", "Submit a Request")}
          </h3>
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value
              }))
            }
            placeholder={localeText(locale, "问题标题", "Issue title")}
          />
          <input
            className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={form.location}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                location: event.target.value
              }))
            }
            placeholder={localeText(locale, "发生位置", "Location")}
          />
          <textarea
            className="min-h-[140px] rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value
              }))
            }
            placeholder={localeText(locale, "问题说明", "Description")}
          />
          {createMutation.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "工单提交失败", "Failed to submit")}
              description={(createMutation.error as Error).message}
            />
          ) : null}
          {createMutation.isSuccess ? (
            <StatePanel
              tone="success"
              title={localeText(locale, "工单已提交", "Request submitted")}
              description={localeText(
                locale,
                "管理员工作台已经可以看到这条记录。",
                "The admin workspace can now see this request."
              )}
            />
          ) : null}
          <button
            type="submit"
            className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
            disabled={
              createMutation.isPending ||
              !form.title.trim() ||
              !form.location.trim() ||
              !form.description.trim()
            }
          >
            {createMutation.isPending
              ? localeText(locale, "提交中", "Submitting")
              : localeText(locale, "提交工单", "Submit Request")}
          </button>
        </form>

        <div className="grid gap-4">
          {requestsQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title={localeText(locale, "正在载入工单", "Loading requests")}
              description={localeText(locale, "请稍候。", "Please wait.")}
            />
          ) : requestsQuery.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "工单暂时无法加载", "Requests are unavailable")}
              description={(requestsQuery.error as Error).message}
            />
          ) : !requestsQuery.data?.length ? (
            <EmptyPanel
              title={localeText(locale, "当前没有工单记录", "No requests yet")}
              description={localeText(
                locale,
                "首次提交后会在这里看到处理进展。",
                "Your request history will appear here after submission."
              )}
            />
          ) : (
            requestsQuery.data.map((request) => (
              <article
                key={request.id}
                className="rounded-[24px] border border-ink/10 bg-white px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{request.title}</h3>
                    <p className="mt-2 text-sm text-slate">{request.location}</p>
                  </div>
                  <StatusPill tone={serviceRequestStatusTone(request.status)}>
                    {serviceRequestStatusLabel(request.status, locale)}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate">{request.description}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoCard
                    label={localeText(locale, "提交时间", "Created At")}
                    value={formatDateTime(request.createdAt)}
                  />
                  <InfoCard
                    label={localeText(locale, "最近更新", "Updated At")}
                    value={formatDateTime(request.updatedAt)}
                  />
                </div>
                <p className="mt-4 text-sm text-ink/70">
                  {localeText(locale, "管理员备注：", "Admin note: ")}
                  {request.adminNote ||
                    localeText(locale, "当前还没有处理备注。", "No admin note yet.")}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </PageSection>
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

function serviceRequestStatusLabel(
  status: "submitted" | "received" | "in_progress" | "resolved" | "closed",
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "submitted":
      return localeText(locale, "待受理", "Submitted");
    case "received":
      return localeText(locale, "已接收", "Received");
    case "in_progress":
      return localeText(locale, "处理中", "In Progress");
    case "resolved":
      return localeText(locale, "已解决", "Resolved");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
  }
}

function serviceRequestStatusTone(
  status: "submitted" | "received" | "in_progress" | "resolved" | "closed"
) {
  switch (status) {
    case "resolved":
    case "closed":
      return "success" as const;
    case "submitted":
      return "brand" as const;
    case "received":
    case "in_progress":
      return "neutral" as const;
  }
}

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchAdminServiceRequests,
  updateServiceRequest
} from "../../../../lib/api/service-request-api";
import { formatDateTime } from "../../../../lib/date";
import { localeText } from "../../../../lib/locale";
import { queryClient } from "../../../../lib/query-client";
import type { Locale } from "../../../../store/locale-store";
import { PageSection } from "../../../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../../../user-experience-kit";
import {
  serviceRequestStatusLabel,
  serviceRequestStatusTone
} from "../admin-helpers";
import { AdminInfoCard } from "../components/admin-info-card";
import { MutationState } from "../components/mutation-state";

export function ServiceRequestsWorkspace({ locale }: { locale: Locale }) {
  const requestsQuery = useQuery({
    queryKey: ["admin", "service-requests"],
    queryFn: fetchAdminServiceRequests
  });
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<
    "submitted" | "received" | "in_progress" | "resolved" | "closed"
  >("submitted");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    const firstRequest = requestsQuery.data?.[0];

    if (!selectedId && firstRequest) {
      setSelectedId(firstRequest.id);
    }
  }, [requestsQuery.data, selectedId]);

  const selectedRequest =
    requestsQuery.data?.find((request) => request.id === selectedId) ??
    requestsQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    setStatus(selectedRequest.status);
    setAdminNote(selectedRequest.adminNote ?? "");
  }, [selectedRequest]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      requestId: string;
      status: "submitted" | "received" | "in_progress" | "resolved" | "closed";
      adminNote: string;
    }) =>
      updateServiceRequest(payload.requestId, {
        status: payload.status,
        adminNote: payload.adminNote
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "service-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["service-requests", "mine"] })
      ]);
    }
  });

  return (
    <PageSection
      title={localeText(locale, "工单工作区", "Service Request Workspace")}
      description={localeText(
        locale,
        "这里集中查看学生报修记录、处理状态与管理员备注。",
        "Review student repair tickets, statuses, and admin notes here."
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),380px]">
        <div className="grid gap-4">
          {requestsQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title={localeText(locale, "正在载入工单工作区", "Loading service requests")}
              description={localeText(locale, "请稍候。", "Please wait.")}
            />
          ) : requestsQuery.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "工单工作区暂时无法加载", "Service request workspace is unavailable")}
              description={(requestsQuery.error as Error).message}
            />
          ) : !requestsQuery.data?.length ? (
            <EmptyPanel
              title={localeText(locale, "当前还没有工单", "No service requests yet")}
              description={localeText(
                locale,
                "学生提交后会直接进入这里。",
                "Student submissions will appear here."
              )}
            />
          ) : (
            requestsQuery.data.map((request) => (
              <button
                key={request.id}
                type="button"
                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                  request.id === selectedRequest?.id
                    ? "border-ember bg-ember/10"
                    : "border-ink/10 bg-white hover:border-moss"
                }`}
                onClick={() => setSelectedId(request.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{request.title}</h3>
                    <p className="mt-2 text-sm text-slate">
                      {request.userEmail} · {request.location}
                    </p>
                  </div>
                  <StatusPill tone={serviceRequestStatusTone(request.status)}>
                    {serviceRequestStatusLabel(request.status, locale)}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate">{request.description}</p>
              </button>
            ))
          )}
        </div>

        <div className="grid gap-4">
          {selectedRequest ? (
            <form
              className="grid gap-4 rounded-[24px] border border-ink/10 bg-white px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();

              if (
                selectedRequest.status !== "closed" &&
                status === "closed" &&
                !window.confirm(
                  localeText(
                    locale,
                    "关闭后该工单将进入结束状态。确认继续吗？",
                    "Closing this request will move it to a final state. Continue?"
                  )
                )
              ) {
                return;
              }

              updateMutation.mutate({
                requestId: selectedRequest.id,
                status,
                adminNote
              });
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-moss">
                    {localeText(locale, "当前工单", "Selected Request")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">
                    {selectedRequest.title}
                  </h3>
                </div>
                <StatusPill tone={serviceRequestStatusTone(status)}>
                  {serviceRequestStatusLabel(status, locale)}
                </StatusPill>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <AdminInfoCard
                  label={localeText(locale, "提交人", "Reporter")}
                  value={selectedRequest.userEmail}
                />
                <AdminInfoCard
                  label={localeText(locale, "发生位置", "Location")}
                  value={selectedRequest.location}
                />
                <AdminInfoCard
                  label={localeText(locale, "提交时间", "Created At")}
                  value={formatDateTime(selectedRequest.createdAt)}
                />
                <AdminInfoCard
                  label={localeText(locale, "最近更新", "Updated At")}
                  value={formatDateTime(selectedRequest.updatedAt)}
                />
              </div>

              <div className="rounded-2xl bg-sand px-4 py-4 text-sm leading-7 text-slate">
                {selectedRequest.description}
              </div>

              <select
                className="rounded-2xl border border-navy/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | "submitted"
                      | "received"
                      | "in_progress"
                      | "resolved"
                      | "closed"
                  )
                }
              >
                <option value="submitted">{localeText(locale, "待受理", "Submitted")}</option>
                <option value="received">{localeText(locale, "已接收", "Received")}</option>
                <option value="in_progress">{localeText(locale, "处理中", "In Progress")}</option>
                <option value="resolved">{localeText(locale, "已解决", "Resolved")}</option>
                <option value="closed">{localeText(locale, "已关闭", "Closed")}</option>
              </select>

              <textarea
                className="min-h-[140px] rounded-2xl border border-navy/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-moss"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder={localeText(locale, "管理员处理备注", "Admin note")}
              />

              <MutationState
                mutation={updateMutation}
                success={localeText(locale, "工单状态已更新。", "Service request updated.")}
              />

              <button
                type="submit"
                className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? localeText(locale, "保存中", "Saving")
                  : localeText(locale, "保存工单更新", "Save Update")}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </PageSection>
  );
}

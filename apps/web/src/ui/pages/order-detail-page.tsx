import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { OrderDetailResponse } from "@campusbook/shared-types";

import {
  ApiError,
  cancelOrder,
  checkInReservation,
  fetchOrderDetail
} from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  bizTypeLabel,
  buildRebookPath,
  canCancel,
  canCheckIn,
  describeOrder,
  orderLocationLabel,
  orderProgressLabel,
  orderProgressTone,
  orderTimeLabel,
  statusLabel,
  statusTone
} from "./order-utils";

export function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const user = useSessionStore((state) => state.user);
  const orderQuery = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => fetchOrderDetail(orderId!),
    enabled: Boolean(orderId)
  });

  const cancelMutation = useMutation({
    mutationFn: (currentOrderId: string) => cancelOrder(currentOrderId),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["orders"]
        }),
        queryClient.invalidateQueries({
          queryKey: ["orders", "detail", result.id]
        })
      ]);
    }
  });

  const checkInMutation = useMutation({
    mutationFn: (currentOrderId: string) => checkInReservation(currentOrderId),
    onSuccess: async (_, currentOrderId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["orders"]
        }),
        queryClient.invalidateQueries({
          queryKey: ["orders", "detail", currentOrderId]
        })
      ]);
    }
  });

  const order = orderQuery.data ?? null;

  return (
    <>
      <PageHero
        eyebrow="Order Detail"
        title={order ? `预约详情 · ${order.orderNo}` : "预约详情"}
        description="详情页集中展示当前预约的总体状态、关键信息和后续操作入口。完成预约后，你可以在这里继续签到、取消、重新预约或回看状态日志。"
        aside={
          order ? (
            <div className="grid gap-3">
              <MetricCard label="当前状态" value={orderProgressLabel(order)} />
              <MetricCard label="业务类别" value={bizTypeLabel(order)} />
              <MetricCard label="预约地点" value={orderLocationLabel(order)} />
            </div>
          ) : (
            <p className="text-sm text-slate">正在载入当前预约详情。</p>
          )
        }
      />

      <PageSection
        title="预约总览"
        description="顶部总览区用于快速确认这笔预约的当前状态，并直接处理签到、取消、重新预约等后续动作。"
        action={
          <button
            type="button"
            className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
            onClick={() => navigate("/orders")}
          >
            返回我的订单
          </button>
        }
      >
        {!orderId ? (
          <EmptyPanel
            title="缺少订单编号"
            description="当前路由没有提供可查询的订单编号。"
          />
        ) : orderQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title="正在载入预约详情"
            description="页面正在整理预约类别、地点、时间和状态日志。"
          />
        ) : orderQuery.isError ? (
          <StatePanel
            tone="danger"
            title="预约详情暂时无法加载"
            description={(orderQuery.error as ApiError).message}
          />
        ) : order ? (
          <div className="grid gap-4">
            <div className="rounded-[28px] border border-ink/10 bg-white px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-moss">
                    当前预约
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold text-ink">
                    {describeOrder(order)}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill tone={orderProgressTone(orderProgressLabel(order))}>
                      {orderProgressLabel(order)}
                    </StatusPill>
                    <StatusPill tone={statusTone(order.status)}>
                      {statusLabel(order.status)}
                    </StatusPill>
                    <StatusPill>{bizTypeLabel(order)}</StatusPill>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canCheckIn(order, user?.id) ? (
                    <button
                      type="button"
                      className="rounded-full border border-moss/25 px-4 py-2 text-sm text-moss transition hover:bg-moss/10 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => checkInMutation.mutate(order.id)}
                      disabled={checkInMutation.isPending}
                    >
                      {checkInMutation.isPending ? "签到中" : "确认签到"}
                    </button>
                  ) : null}
                  {canCancel(order, user?.id, user?.role) ? (
                    <button
                      type="button"
                      className="rounded-full border border-danger/25 px-4 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => cancelMutation.mutate(order.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? "取消中" : "取消预约"}
                    </button>
                  ) : null}
                  <Link
                    to={buildRebookPath(order)}
                    className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                  >
                    重新预约
                  </Link>
                  <Link
                    to="/orders/cancellations"
                    className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                  >
                    取消记录
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard label="预约类别" value={bizTypeLabel(order)} />
                <InfoCard label="预约地点" value={orderLocationLabel(order)} />
                <InfoCard label="预约时间" value={orderTimeLabel(order)} />
                <InfoCard label="下单时间" value={formatDateTime(order.createdAt)} />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),360px]">
              <div className="grid gap-4">
                <DetailSection title="关键信息">
                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoCard label="订单号" value={order.orderNo} />
                    <InfoCard label="提交用户" value={order.userEmail} />
                    <InfoCard label="预约状态" value={statusLabel(order.status)} />
                    <InfoCard
                      label="签到窗口"
                      value={
                        order.checkInOpenAt && order.checkInCloseAt
                          ? `${formatDateTime(order.checkInOpenAt)} - ${formatDateTime(order.checkInCloseAt)}`
                          : "无签到要求"
                      }
                    />
                  </div>
                </DetailSection>

                <DetailSection title="业务明细">
                  <div className="grid gap-3">
                    {order.academicReservation ? (
                      <DetailItem
                        title={order.academicReservation.resourceName}
                        description={`${order.academicReservation.resourceUnitName} · ${orderTimeLabel(order)}`}
                      />
                    ) : null}
                    {order.sportsReservationSlots.length > 0 ? (
                      <DetailItem
                        title={order.sportsReservationSlots[0]?.resourceName ?? "体育预约"}
                        description={`${order.sportsReservationSlots
                          .map((slot) => slot.resourceUnitName)
                          .join(" / ")} · ${order.sportsReservationSlots.length} 个槽位`}
                      />
                    ) : null}
                    {order.activityRegistration ? (
                      <DetailItem
                        title={order.activityRegistration.activityTitle}
                        description={order.activityRegistration.activityTicketName}
                      />
                    ) : null}
                  </div>
                </DetailSection>

                {order.reservationParticipants.length > 0 ? (
                  <DetailSection title="预约人与同行人">
                    <div className="grid gap-3">
                      {order.reservationParticipants.map((participant) => (
                        <div
                          key={participant.userId}
                          className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {participant.userEmail}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/45">
                                {participant.isHost ? "预约人" : "同行人"}
                              </p>
                            </div>
                            <StatusPill
                              tone={participant.checkedInAt ? "success" : "brand"}
                            >
                              {participant.checkedInAt ? "已签到" : "待签到"}
                            </StatusPill>
                          </div>
                          <p className="mt-2 text-sm text-ink/70">
                            {participant.checkedInAt
                              ? `签到时间：${formatDateTime(participant.checkedInAt)}`
                              : "尚未完成签到"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                ) : null}
              </div>

              <div className="grid gap-4">
                <DetailSection title="状态日志">
                  <div className="grid gap-3">
                    {order.statusLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-ink/10 bg-sand px-4 py-4"
                      >
                        <p className="text-sm font-medium text-ink">
                          {(log.fromStatus
                            ? `${statusLabel(log.fromStatus)} -> `
                            : "") + statusLabel(log.toStatus)}
                        </p>
                        <p className="mt-2 text-sm text-ink/70">
                          {log.reason || "未记录原因"}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </DetailSection>

                {cancelMutation.isError || checkInMutation.isError ? (
                  <StatePanel
                    tone="danger"
                    title="操作未完成"
                    description={
                      cancelMutation.isError
                        ? (cancelMutation.error as ApiError).message
                        : (checkInMutation.error as ApiError).message
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </PageSection>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
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

function DetailItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-sand px-4 py-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-ink/70">{description}</p>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { OrderDetailResponse } from "@campusbook/shared-types";

import {
  ApiError,
  cancelOrder,
  checkInReservation,
  fetchOrders
} from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  EmptyPanel,
  HighlightPanel,
  StatePanel,
  StepList,
  StatusPill
} from "../user-experience-kit";

export function OrdersPage() {
  const user = useSessionStore((state) => state.user);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders
  });

  const selectedOrder = useMemo(
    () =>
      ordersQuery.data?.find((order) => order.id === selectedOrderId) ??
      ordersQuery.data?.[0] ??
      null,
    [ordersQuery.data, selectedOrderId]
  );
  const orderStats = useMemo(() => {
    const orders = ordersQuery.data ?? [];

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending_confirmation").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length
    };
  }, [ordersQuery.data]);

  useEffect(() => {
    const firstOrder = ordersQuery.data?.[0];

    if (!selectedOrderId && firstOrder) {
      setSelectedOrderId(firstOrder.id);
    }
  }, [ordersQuery.data, selectedOrderId]);

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orders"]
      });
    }
  });
  const checkInMutation = useMutation({
    mutationFn: (orderId: string) => checkInReservation(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["orders"]
      });
    }
  });

  return (
    <>
      <PageHero
        eyebrow="Orders"
        title={user?.role === "admin" ? "订单中心" : "我的订单"}
        description={
          user?.role === "admin"
            ? "管理员可以在这里回看全站订单和状态迁移，快速确认预约、抢票与取消链路是否稳定。"
            : "这里会集中展示你的预约、活动报名和状态变更日志，方便回看每一笔操作的生命周期。"
        }
        aside={
          <>
            <p className="text-sm text-slate">当前展示最近 30 条订单。</p>
            <p className="mt-2 text-sm text-slate">
              普通用户只能看到自己的订单，管理员可以看到全站订单。
            </p>
          </>
        }
      />

      <PageSection
        title="订单概览"
        description="订单页是所有服务的收口位置。无论你是预约空间、预约体育设施还是报名活动，结果都会汇总到这里。"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),420px]">
          <HighlightPanel
            eyebrow="Unified Orders"
            title="用一处订单中心回看全部预约与报名结果"
            description="订单页把不同业务的结果统一成相同的状态语言。你不需要再回到原页面查找结果，只要在这里看状态、明细和日志即可。"
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <QuickFact label="订单总数" value={String(orderStats.total)} />
              <QuickFact label="待确认" value={String(orderStats.pending)} />
              <QuickFact label="已确认" value={String(orderStats.confirmed)} />
              <QuickFact label="已取消" value={String(orderStats.cancelled)} />
            </div>
          </HighlightPanel>
          <StepList
            items={[
              {
                title: "切换订单",
                description: "先从左侧列表切换到想查看的预约或报名记录。"
              },
              {
                title: "查看明细",
                description: "右侧会展示资源、时段、票种和提交用户等关键信息。"
              },
              {
                title: "回看日志",
                description: "状态变化和原因都会进入日志，便于追踪整笔订单的生命周期。"
              }
            ]}
          />
        </div>
      </PageSection>

      <PageSection
        title="最近订单"
        description="左侧快速切换订单，右侧查看明细、状态和日志。"
      >
        {ordersQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title="正在载入订单中心"
            description="页面正在整理最近的预约、报名与状态变化记录。"
          />
        ) : ordersQuery.isError ? (
          <StatePanel
            tone="danger"
            title="订单中心暂时无法加载"
            description={(ordersQuery.error as ApiError).message}
          />
        ) : !ordersQuery.data?.length ? (
          <EmptyPanel
            title="当前还没有可展示的订单"
            description="登录后完成预约或活动报名后，订单会自动出现在这里。"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[340px,minmax(0,1fr)]">
            <div className="grid gap-3">
              {ordersQuery.data.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`rounded-[26px] border px-4 py-4 text-left transition ${
                    selectedOrder?.id === order.id
                      ? "border-ember bg-gradient-to-br from-ember/10 to-white"
                      : "border-ink/10 bg-sand hover:border-moss"
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-moss">
                        {bizTypeLabel(order)}
                      </p>
                      <p className="mt-2 text-base font-semibold text-ink">
                        {order.orderNo}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-ink/75">
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink/75">
                    {describeOrder(order)}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink/45">
                    {formatDateTime(order.createdAt)}
                  </p>
                </button>
              ))}
            </div>

            {selectedOrder ? (
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-ink/10 bg-sand px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-moss">
                        订单详情
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-ink">
                        {selectedOrder.orderNo}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill
                          tone={
                            selectedOrder.status === "cancelled"
                              ? "danger"
                              : selectedOrder.status === "confirmed"
                                ? "success"
                                : "brand"
                          }
                        >
                          {statusLabel(selectedOrder.status)}
                        </StatusPill>
                        <StatusPill>{bizTypeLabel(selectedOrder)}</StatusPill>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canCheckIn(selectedOrder, user?.id) ? (
                        <button
                          type="button"
                          className="rounded-full border border-moss/25 px-4 py-2 text-sm text-moss transition hover:bg-moss/10 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => checkInMutation.mutate(selectedOrder.id)}
                          disabled={checkInMutation.isPending}
                        >
                          {checkInMutation.isPending ? "签到中" : "立即签到"}
                        </button>
                      ) : null}
                      {canCancel(selectedOrder, user?.id, user?.role) ? (
                        <button
                          type="button"
                          className="rounded-full border border-danger/25 px-4 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => cancelMutation.mutate(selectedOrder.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? "取消中" : "取消订单"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoCard label="业务类型" value={bizTypeLabel(selectedOrder)} />
                    <InfoCard
                      label="下单时间"
                      value={formatDateTime(selectedOrder.createdAt)}
                    />
                    <InfoCard
                      label="过期时间"
                      value={formatDateTime(selectedOrder.expireAt)}
                    />
                    <InfoCard
                      label="提交用户"
                      value={selectedOrder.userEmail}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                  <h3 className="text-lg font-semibold text-ink">业务明细</h3>
                  <div className="mt-4 grid gap-3 text-sm text-ink/80">
                    {selectedOrder.academicReservation ? (
                      <DetailItem
                        title={selectedOrder.academicReservation.resourceName}
                        description={`${selectedOrder.academicReservation.resourceUnitName} · ${formatDateTime(selectedOrder.academicReservation.startTime)} - ${formatDateTime(selectedOrder.academicReservation.endTime)}`}
                      />
                    ) : null}
                    {selectedOrder.sportsReservationSlots.length ? (
                      <DetailItem
                        title={
                          selectedOrder.sportsReservationSlots[0]?.resourceName ??
                          "体育预约"
                        }
                        description={`${selectedOrder.sportsReservationSlots
                          .map((slot) => slot.resourceUnitName)
                          .join(" / ")} · ${selectedOrder.sportsReservationSlots.length} 个槽位`}
                      />
                    ) : null}
                    {selectedOrder.activityRegistration ? (
                      <DetailItem
                        title={selectedOrder.activityRegistration.activityTitle}
                        description={selectedOrder.activityRegistration.activityTicketName}
                      />
                    ) : null}
                    {!selectedOrder.academicReservation &&
                    !selectedOrder.sportsReservationSlots.length &&
                    !selectedOrder.activityRegistration ? (
                      <p className="text-sm text-ink/60">暂无明细。</p>
                    ) : null}
                  </div>
                </div>

                {selectedOrder.reservationCategory ? (
                  <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                    <h3 className="text-lg font-semibold text-ink">签到与同行人</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoCard
                        label="签到开放"
                        value={formatDateTime(selectedOrder.checkInOpenAt)}
                      />
                      <InfoCard
                        label="签到截止"
                        value={formatDateTime(selectedOrder.checkInCloseAt)}
                      />
                    </div>
                    <div className="mt-4 grid gap-3">
                      {selectedOrder.reservationParticipants.map((participant) => (
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
                              {participant.checkedInAt ? "已签到" : "未签到"}
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
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
                  <h3 className="text-lg font-semibold text-ink">状态日志</h3>
                  <div className="mt-4 grid gap-3">
                    {selectedOrder.statusLogs.map((log) => (
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
                </div>

                {cancelMutation.isError ? (
                  <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {(cancelMutation.error as ApiError).message}
                  </div>
                ) : null}
                {checkInMutation.isError ? (
                  <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {(checkInMutation.error as ApiError).message}
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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

function canCancel(
  order: OrderDetailResponse,
  currentUserId?: string,
  currentUserRole?: "student" | "admin"
) {
  return (
    (currentUserRole === "admin" || order.userId === currentUserId) &&
    (order.status === "pending_confirmation" || order.status === "confirmed")
  );
}

function canCheckIn(order: OrderDetailResponse, currentUserId?: string) {
  if (!currentUserId || order.status !== "confirmed") {
    return false;
  }

  if (!order.reservationCategory || !order.checkInOpenAt || !order.checkInCloseAt) {
    return false;
  }

  const participant = order.reservationParticipants.find(
    (item) => item.userId === currentUserId
  );

  if (!participant || participant.checkedInAt) {
    return false;
  }

  const now = Date.now();
  return (
    new Date(order.checkInOpenAt).getTime() <= now &&
    now <= new Date(order.checkInCloseAt).getTime()
  );
}

function describeOrder(order: OrderDetailResponse) {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceUnitName} · ${formatDateTime(order.academicReservation.startTime)}`;
  }

  if (order.sportsReservationSlots.length) {
    const firstSlot = order.sportsReservationSlots[0];

    if (!firstSlot) {
      return "体育预约";
    }

    return `${firstSlot.resourceName} · ${order.sportsReservationSlots.length} 个槽位`;
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return "待补充业务摘要";
}

function bizTypeLabel(order: OrderDetailResponse) {
  return order.bizType === "activity_registration" ? "活动报名" : "资源预约";
}

function statusLabel(status: OrderDetailResponse["status"]) {
  switch (status) {
    case "pending_confirmation":
      return "待确认";
    case "confirmed":
      return "已确认";
    case "cancelled":
      return "已取消";
    case "no_show":
      return "已爽约";
  }
}

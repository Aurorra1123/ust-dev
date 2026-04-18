import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { OrderDetailResponse } from "@campusbook/shared-types";

import { ApiError, cancelOrder, fetchOrders } from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";

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

  return (
    <>
      <PageHero
        eyebrow="Orders"
        title={user?.role === "admin" ? "订单中心" : "我的订单"}
        description={
          user?.role === "admin"
            ? "管理员可以查看最近订单状态，确认当前站点的预约、抢票与取消流转是否正常。"
            : "这里会展示你最近的预约、抢票和状态变更日志，便于回看每一笔操作的生命周期。"
        }
        aside={
          <>
            <p className="text-sm text-ink/75">当前展示最近 30 条订单。</p>
            <p className="mt-2 text-sm text-ink/75">
              普通用户只能看到自己的订单，管理员可以看到全站订单。
            </p>
          </>
        }
      />

      <PageSection title="最近订单">
        {ordersQuery.isLoading ? (
          <p className="text-sm text-ink/70">正在加载订单列表。</p>
        ) : ordersQuery.isError ? (
          <p className="text-sm text-ember">
            {(ordersQuery.error as ApiError).message}
          </p>
        ) : !ordersQuery.data?.length ? (
          <p className="text-sm text-ink/70">当前还没有可展示的订单。</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[340px,minmax(0,1fr)]">
            <div className="grid gap-3">
              {ordersQuery.data.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    selectedOrder?.id === order.id
                      ? "border-ember bg-ember/10"
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
                      <p className="mt-2 text-sm text-ink/75">
                        当前状态：{statusLabel(selectedOrder.status)}
                      </p>
                    </div>
                    {canCancel(selectedOrder) ? (
                      <button
                        type="button"
                        className="rounded-full border border-ember/25 px-4 py-2 text-sm text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => cancelMutation.mutate(selectedOrder.id)}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? "取消中" : "取消订单"}
                      </button>
                    ) : null}
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
                  <div className="rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">
                    {(cancelMutation.error as ApiError).message}
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

function DetailItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-sand px-4 py-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-ink/70">{description}</p>
    </div>
  );
}

function canCancel(order: OrderDetailResponse) {
  return (
    order.status === "pending_confirmation" || order.status === "confirmed"
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

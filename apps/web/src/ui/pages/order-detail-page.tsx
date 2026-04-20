import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ApiError, cancelOrder, checkInReservation, fetchOrderDetail } from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { queryClient } from "../../lib/query-client";
import { useSessionStore } from "../../store/session-store";
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
  orderTimeLabel
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
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", result.id] })
      ]);
    }
  });

  const checkInMutation = useMutation({
    mutationFn: (currentOrderId: string) => checkInReservation(currentOrderId),
    onSuccess: async (_, currentOrderId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", currentOrderId] })
      ]);
    }
  });

  const order = orderQuery.data ?? null;

  return (
    <PageSection
      title="预约详情"
      description="查看当前预约状态和关键信息。"
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
        <EmptyPanel title="缺少订单编号" description="当前没有可查询的订单。" />
      ) : orderQuery.isLoading ? (
        <StatePanel tone="loading" title="正在载入详情" description="请稍候。" />
      ) : orderQuery.isError ? (
        <StatePanel
          tone="danger"
          title="详情暂时无法加载"
          description={(orderQuery.error as ApiError).message}
        />
      ) : order ? (
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-ink">{describeOrder(order)}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={orderProgressTone(orderProgressLabel(order))}>
                    {orderProgressLabel(order)}
                  </StatusPill>
                  <StatusPill>{bizTypeLabel(order)}</StatusPill>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {canCheckIn(order, user?.id) ? (
                  <button
                    type="button"
                    className="rounded-full border border-moss/25 px-4 py-2 text-sm text-moss transition hover:bg-moss/10"
                    onClick={() => checkInMutation.mutate(order.id)}
                    disabled={checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? "签到中" : "确认预约"}
                  </button>
                ) : null}
                {canCancel(order, user?.id, user?.role) ? (
                  <button
                    type="button"
                    className="rounded-full border border-danger/25 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
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
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="预约类别" value={bizTypeLabel(order)} />
            <InfoCard label="地点" value={orderLocationLabel(order)} />
            <InfoCard label="时间" value={orderTimeLabel(order)} />
            <InfoCard label="下单时间" value={formatDateTime(order.createdAt)} />
            <InfoCard label="订单号" value={order.orderNo} />
            <InfoCard label="预约人" value={order.userEmail} />
            <InfoCard
              label="签到窗口"
              value={
                order.checkInOpenAt && order.checkInCloseAt
                  ? `${formatDateTime(order.checkInOpenAt)} - ${formatDateTime(order.checkInCloseAt)}`
                  : "无"
              }
            />
          </div>

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
      ) : null}
    </PageSection>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

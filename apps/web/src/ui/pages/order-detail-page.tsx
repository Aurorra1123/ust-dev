import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  cancelOrder,
  checkInReservation,
  fetchOrderDetail
} from "../../lib/api/order-api";
import { ApiError } from "../../lib/http/errors";
import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  bizTypeLabel,
  buildRebookPath,
  canCancel,
  canCheckIn,
  describeOrder,
  getOrderProgressState,
  orderLocationLabel,
  orderProgressLabel,
  orderProgressTone,
  orderTimeLabel
} from "./order-utils";

export function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const locale = useLocaleStore((state) => state.locale);
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
      title={localeText(locale, "预约详情", "Order Details")}
      description={localeText(
        locale,
        "查看当前预约状态和关键信息。",
        "Review the current booking status and key details."
      )}
      action={
        <button
          type="button"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          onClick={() => navigate("/orders")}
        >
          {localeText(locale, "返回我的订单", "Back to My Orders")}
        </button>
      }
    >
      {!orderId ? (
        <EmptyPanel
          title={localeText(locale, "缺少订单编号", "Missing order id")}
          description={localeText(
            locale,
            "当前没有可查询的订单。",
            "There is no order to display."
          )}
        />
      ) : orderQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入详情", "Loading details")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : orderQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "详情暂时无法加载", "Order details are unavailable")}
          description={(orderQuery.error as ApiError).message}
        />
      ) : order ? (
        <div className="grid gap-4">
          <div className="rounded-[24px] border border-ink/10 bg-white px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-ink">
                  {describeOrder(order, locale)}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone={orderProgressTone(getOrderProgressState(order))}>
                    {orderProgressLabel(getOrderProgressState(order), locale)}
                  </StatusPill>
                  <StatusPill>{bizTypeLabel(order, locale)}</StatusPill>
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
                    {checkInMutation.isPending
                      ? localeText(locale, "签到中", "Checking In")
                      : localeText(locale, "确认预约", "Check In")}
                  </button>
                ) : null}
                {canCancel(order, user?.id, user?.role) ? (
                  <button
                    type="button"
                    className="rounded-full border border-danger/25 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
                    onClick={() => cancelMutation.mutate(order.id)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending
                      ? localeText(locale, "取消中", "Cancelling")
                      : localeText(locale, "取消预约", "Cancel Order")}
                  </button>
                ) : null}
                <Link
                  to={buildRebookPath(order)}
                  className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
                >
                  {localeText(locale, "重新预约", "Book Again")}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label={localeText(locale, "预约类别", "Category")}
              value={bizTypeLabel(order, locale)}
            />
            <InfoCard
              label={localeText(locale, "地点", "Location")}
              value={orderLocationLabel(order, locale)}
            />
            <InfoCard
              label={localeText(locale, "时间", "Time")}
              value={orderTimeLabel(order, locale)}
            />
            <InfoCard
              label={localeText(locale, "下单时间", "Created At")}
              value={formatDateTime(order.createdAt)}
            />
            <InfoCard label={localeText(locale, "订单号", "Order No.")} value={order.orderNo} />
            <InfoCard label={localeText(locale, "预约人", "Reporter")} value={order.userEmail} />
            <InfoCard
              label={localeText(locale, "签到窗口", "Check-in Window")}
              value={
                order.checkInOpenAt && order.checkInCloseAt
                  ? `${formatDateTime(order.checkInOpenAt)} - ${formatDateTime(order.checkInCloseAt)}`
                  : localeText(locale, "无", "None")
              }
            />
          </div>

          {cancelMutation.isError || checkInMutation.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "操作未完成", "Action failed")}
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

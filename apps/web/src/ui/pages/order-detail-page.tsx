import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { OrderDetailResponse } from "@campusbook/shared-types";

import {
  cancelOrder,
  checkInReservation,
  confirmMockPayment,
  fetchOrderDetail,
  startMockPayment
} from "../../lib/api/order-api";
import { getErrorMessage } from "../../lib/http/errors";
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
  formatAmount,
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

  const mockPaymentMutation = useMutation({
    mutationFn: async (currentOrderId: string) => {
      const payment = await startMockPayment(currentOrderId);
      return confirmMockPayment({
        transactionNo: payment.transactionNo
      });
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", result.id] })
      ]);
    }
  });

  const order = orderQuery.data ?? null;
  const latestPayment =
    order?.paymentRecords.length ? order.paymentRecords[order.paymentRecords.length - 1] : null;
  const remainingPaymentTime = order ? getRemainingPaymentTime(order.expireAt) : null;

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
          description={getErrorMessage(orderQuery.error)}
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
                {order.status === "pending_confirmation" &&
                order.totalAmountCents > 0 &&
                latestPayment?.payStatus === "pending" ? (
                  <button
                    type="button"
                    className="rounded-full bg-ember px-4 py-2 text-sm text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
                    onClick={() => mockPaymentMutation.mutate(order.id)}
                    disabled={mockPaymentMutation.isPending}
                  >
                    {mockPaymentMutation.isPending
                      ? localeText(locale, "支付中", "Paying")
                      : localeText(locale, "模拟支付", "Mock Pay")}
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
            <InfoCard
              label={localeText(locale, "金额", "Amount")}
              value={formatAmount(order.totalAmountCents, locale)}
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
            <InfoCard
              label={localeText(locale, "支付状态", "Payment Status")}
              value={paymentStatusLabel(latestPayment?.payStatus, locale)}
            />
          </div>

          {order.totalAmountCents > 0 ? (
            <div className="rounded-[24px] border border-ink/10 bg-sand px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {localeText(locale, "支付信息", "Payment")}
                  </h3>
                  <p className="mt-2 text-sm text-slate">
                    {localeText(
                      locale,
                      `当前状态：${paymentStatusLabel(latestPayment?.payStatus, locale)}`,
                      `Current status: ${paymentStatusLabel(latestPayment?.payStatus, locale)}`
                    )}
                  </p>
                  {order.expireAt ? (
                    <p className="mt-2 text-sm text-slate">
                      {localeText(
                        locale,
                        `待支付截止：${formatDateTime(order.expireAt)}${remainingPaymentTime ? `（剩余 ${remainingPaymentTime}）` : ""}`,
                        `Pay before ${formatDateTime(order.expireAt)}${remainingPaymentTime ? ` (${remainingPaymentTime} left)` : ""}`
                      )}
                    </p>
                  ) : null}
                  {latestPayment?.transactionNo ? (
                    <p className="mt-2 text-sm text-slate">
                      {localeText(
                        locale,
                        `交易号：${latestPayment.transactionNo}`,
                        `Transaction No.: ${latestPayment.transactionNo}`
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {cancelMutation.isError || checkInMutation.isError || mockPaymentMutation.isError ? (
            <StatePanel
              tone="danger"
              title={localeText(locale, "操作未完成", "Action failed")}
              description={
                cancelMutation.isError
                  ? getErrorMessage(cancelMutation.error)
                  : checkInMutation.isError
                    ? getErrorMessage(checkInMutation.error)
                    : getErrorMessage(mockPaymentMutation.error)
              }
            />
          ) : null}
        </div>
      ) : null}
    </PageSection>
  );
}

function paymentStatusLabel(
  status: OrderDetailResponse["paymentRecords"][number]["payStatus"] | undefined,
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "paid":
      return localeText(locale, "已支付", "Paid");
    case "failed":
      return localeText(locale, "支付失败", "Failed");
    case "refunded":
      return localeText(locale, "已退款", "Refunded");
    case "pending":
      return localeText(locale, "待支付", "Pending");
    default:
      return localeText(locale, "未发起", "Not Started");
  }
}

function getRemainingPaymentTime(expireAt?: string | null) {
  if (!expireAt) {
    return null;
  }

  const remainingMs = new Date(expireAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "0m";
  }

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

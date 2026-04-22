import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  cancelOrder,
  checkInReservation,
  confirmMockPayment,
  fetchOrderDetail,
  startMockPayment
} from "../../lib/api/order-api";
import { getErrorMessage } from "../../lib/http/errors";
import { localeText } from "../../lib/locale";
import { queryClient } from "../../lib/query-client";
import { useLocaleStore } from "../../store/locale-store";
import { useSessionStore } from "../../store/session-store";
import { PageSection } from "../page-section";
import { StatePanel, StatusPill } from "../user-experience-kit";
import { OrderInfoGrid } from "./order-info-grid";
import { OrderPaymentPanel } from "./order-payment-panel";
import { OrderPrimaryActions } from "./order-primary-actions";
import { OrderDetailStateView } from "./order-detail-state-view";
import {
  bizTypeLabel,
  describeOrder,
  getLatestPayment,
  getOrderInfoCards,
  getOrderProgressState,
  orderProgressLabel,
  orderProgressTone,
  shouldShowPaymentPanel
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
  const latestPayment = getLatestPayment(order);
  const orderInfoCards = order ? getOrderInfoCards(order, locale) : [];

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
      <OrderDetailStateView
        locale={locale}
        orderId={orderId}
        isLoading={orderQuery.isLoading}
        isError={orderQuery.isError}
        error={orderQuery.isError ? orderQuery.error : null}
      >
        {order ? (
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

              <OrderPrimaryActions
                locale={locale}
                order={order}
                userId={user?.id}
                userRole={user?.role}
                latestPaymentStatus={latestPayment?.payStatus}
                isCancelPending={cancelMutation.isPending}
                isCheckInPending={checkInMutation.isPending}
                isMockPaymentPending={mockPaymentMutation.isPending}
                onCancel={() => cancelMutation.mutate(order.id)}
                onCheckIn={() => checkInMutation.mutate(order.id)}
                onMockPay={() => mockPaymentMutation.mutate(order.id)}
              />
            </div>
          </div>

          <OrderInfoGrid cards={orderInfoCards} />

          {shouldShowPaymentPanel(order) ? (
            <OrderPaymentPanel locale={locale} order={order} />
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
      </OrderDetailStateView>
    </PageSection>
  );
}

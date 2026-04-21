import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchOrders } from "../../lib/api/order-api";
import { ApiError } from "../../lib/http/errors";
import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  getCancellationReason,
  getCancelledAt,
  getOrderProgressState,
  getOrderTimelineAt,
  orderCategoryLabel,
  orderProgressLabel,
  orderProgressTone,
  orderResourceLabel
} from "./order-utils";

export function OrdersPage() {
  const locale = useLocaleStore((state) => state.locale);
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders
  });

  const orders = [...(ordersQuery.data ?? [])].sort(
    (left, right) =>
      new Date(getOrderTimelineAt(right)).getTime() -
      new Date(getOrderTimelineAt(left)).getTime()
  );

  return (
    <PageSection
      title={localeText(locale, "我的订单", "My Orders")}
      description={localeText(
        locale,
        "列表集中展示进行中、已结束与已取消的预约记录；已取消订单也会保留取消时间与原因。",
        "The list combines active, finished, and cancelled orders. Cancelled items keep their cancellation time and reason."
      )}
    >
      {ordersQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入订单", "Loading orders")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : ordersQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "订单暂时无法加载", "Orders are unavailable")}
          description={(ordersQuery.error as ApiError).message}
        />
      ) : !orders.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有订单", "No orders yet")}
          description={localeText(
            locale,
            "完成预约后会显示在这里。",
            "Completed bookings will appear here."
          )}
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const progressState = getOrderProgressState(order);
            const progress = orderProgressLabel(progressState, locale);
            const isCancelled = order.status === "cancelled";
            const timelineAt = isCancelled ? getCancelledAt(order) : order.createdAt;
            const cancellationReason = getCancellationReason(order);

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="rounded-[24px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {orderResourceLabel(order, locale)}
                    </p>
                    <p className="mt-2 text-sm text-slate">
                      {formatDateTime(timelineAt)}
                    </p>
                  </div>
                  <StatusPill tone={orderProgressTone(progressState)}>{progress}</StatusPill>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate md:grid-cols-4">
                  <RecordItem
                    label={
                      isCancelled
                        ? localeText(locale, "取消时间", "Cancelled At")
                        : localeText(locale, "下单时间", "Created At")
                    }
                    value={formatDateTime(timelineAt)}
                  />
                  <RecordItem
                    label={localeText(locale, "类别", "Category")}
                    value={orderCategoryLabel(order, locale)}
                  />
                  <RecordItem
                    label={localeText(locale, "资源", "Resource")}
                    value={orderResourceLabel(order, locale)}
                  />
                  <RecordItem label={localeText(locale, "状态", "Status")} value={progress} />
                </div>

                {isCancelled ? (
                  <div className="mt-4 rounded-2xl border border-danger/15 bg-danger/5 px-4 py-4 text-sm text-ink/75">
                    <p className="text-xs uppercase tracking-[0.2em] text-danger/70">
                      {localeText(locale, "取消原因", "Cancellation Reason")}
                    </p>
                    <p className="mt-2 leading-7">
                      {cancellationReason ||
                        localeText(locale, "未记录取消原因", "No cancellation reason recorded")}
                    </p>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}

function RecordItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

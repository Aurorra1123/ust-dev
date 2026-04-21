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
  getOrderProgressState,
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

  const orders = [...(ordersQuery.data ?? [])]
    .filter((order) => order.status !== "cancelled")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );

  return (
    <PageSection
      title={localeText(locale, "我的订单", "My Orders")}
      description={localeText(
        locale,
        "列表集中展示日期、类别、资源和状态，已取消历史单独归入取消记录页。",
        "The list shows active and historical order details. Cancelled history is separated into the cancellation page."
      )}
      action={
        <Link
          to="/orders/cancellations"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
        >
          {localeText(locale, "查看取消记录", "View Cancelled")}
        </Link>
      }
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
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <StatusPill tone={orderProgressTone(progressState)}>{progress}</StatusPill>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate md:grid-cols-4">
                  <RecordItem
                    label={localeText(locale, "日期", "Date")}
                    value={formatDateTime(order.createdAt)}
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

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchOrders } from "../../lib/api/order-api";
import { ApiError } from "../../lib/http/errors";
import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { useLocaleStore } from "../../store/locale-store";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";
import {
  formatAmount,
  getCancelledAt,
  getCancellationReason,
  orderResourceLabel
} from "./order-utils";

export function CancelledOrdersPage() {
  const locale = useLocaleStore((state) => state.locale);
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders
  });

  const cancelledOrders = [...(ordersQuery.data ?? [])]
    .filter((order) => order.status === "cancelled")
    .sort(
      (left, right) =>
        new Date(getCancelledAt(right)).getTime() -
        new Date(getCancelledAt(left)).getTime()
    );

  return (
    <PageSection
      title={localeText(locale, "取消记录", "Cancelled Orders")}
      description={localeText(
        locale,
        "查看已取消预约的历史信息与原因回溯。",
        "Review cancelled bookings and their reasons."
      )}
      action={
        <Link
          to="/orders"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
        >
          {localeText(locale, "返回我的订单", "Back to My Orders")}
        </Link>
      }
    >
      {ordersQuery.isLoading ? (
        <StatePanel
          tone="loading"
          title={localeText(locale, "正在载入取消记录", "Loading cancelled orders")}
          description={localeText(locale, "请稍候。", "Please wait.")}
        />
      ) : ordersQuery.isError ? (
        <StatePanel
          tone="danger"
          title={localeText(locale, "取消记录暂时无法加载", "Cancelled orders are unavailable")}
          description={(ordersQuery.error as ApiError).message}
        />
      ) : !cancelledOrders.length ? (
        <EmptyPanel
          title={localeText(locale, "当前没有取消记录", "No cancelled orders")}
          description={localeText(
            locale,
            "已取消预约会显示在这里。",
            "Cancelled bookings will appear here."
          )}
        />
      ) : (
        <div className="grid gap-4">
          {cancelledOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="rounded-[24px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss"
            >
              <div className="grid gap-3 text-sm text-slate md:grid-cols-4">
                <InfoCard
                  label={localeText(locale, "取消时间", "Cancelled At")}
                  value={formatDateTime(getCancelledAt(order))}
                />
                <InfoCard
                  label={localeText(locale, "预约人", "Reporter")}
                  value={order.userEmail}
                />
                <InfoCard
                  label={localeText(locale, "资源", "Resource")}
                  value={orderResourceLabel(order, locale)}
                />
                <InfoCard
                  label={localeText(locale, "费用", "Amount")}
                  value={formatAmount(order.totalAmountCents, locale)}
                />
              </div>
              <p className="mt-4 text-sm text-ink/70">
                {localeText(locale, "备注：", "Reason: ")}
                {getCancellationReason(order) ||
                  localeText(locale, "未记录备注", "No reason recorded")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </PageSection>
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

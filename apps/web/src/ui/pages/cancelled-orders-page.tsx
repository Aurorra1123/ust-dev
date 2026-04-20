import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { ApiError, fetchOrders } from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel } from "../user-experience-kit";
import {
  formatAmount,
  getCancelledAt,
  getCancellationReason,
  orderResourceLabel
} from "./order-utils";

export function CancelledOrdersPage() {
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
      title="取消记录"
      description="查看已取消预约的历史信息。"
      action={
        <Link
          to="/orders"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
        >
          返回我的订单
        </Link>
      }
    >
      {ordersQuery.isLoading ? (
        <StatePanel tone="loading" title="正在载入取消记录" description="请稍候。" />
      ) : ordersQuery.isError ? (
        <StatePanel
          tone="danger"
          title="取消记录暂时无法加载"
          description={(ordersQuery.error as ApiError).message}
        />
      ) : !cancelledOrders.length ? (
        <EmptyPanel title="当前没有取消记录" description="已取消预约会显示在这里。" />
      ) : (
        <div className="grid gap-4">
          {cancelledOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="rounded-[24px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss"
            >
              <div className="grid gap-3 text-sm text-slate md:grid-cols-4">
                <InfoCard label="取消时间" value={formatDateTime(getCancelledAt(order))} />
                <InfoCard label="预约人" value={order.userEmail} />
                <InfoCard label="资源" value={orderResourceLabel(order)} />
                <InfoCard label="费用" value={formatAmount(order.totalAmountCents)} />
              </div>
              <p className="mt-4 text-sm text-ink/70">备注：{getCancellationReason(order)}</p>
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

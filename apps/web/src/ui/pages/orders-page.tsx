import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchOrders } from "../../lib/api/order-api";
import { ApiError } from "../../lib/http/errors";
import { formatDateTime } from "../../lib/date";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  orderCategoryLabel,
  orderProgressLabel,
  orderProgressTone,
  orderResourceLabel
} from "./order-utils";

export function OrdersPage() {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders
  });

  const orders = [...(ordersQuery.data ?? [])].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  return (
    <PageSection
      title="我的订单"
      description="列表集中展示日期、类别、资源和状态。"
      action={
        <Link
          to="/orders/cancellations"
          className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
        >
          查看取消记录
        </Link>
      }
    >
      {ordersQuery.isLoading ? (
        <StatePanel tone="loading" title="正在载入订单" description="请稍候。" />
      ) : ordersQuery.isError ? (
        <StatePanel
          tone="danger"
          title="订单暂时无法加载"
          description={(ordersQuery.error as ApiError).message}
        />
      ) : !orders.length ? (
        <EmptyPanel title="当前没有订单" description="完成预约后会显示在这里。" />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const progress = orderProgressLabel(order);

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="rounded-[24px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {orderResourceLabel(order)}
                    </p>
                    <p className="mt-2 text-sm text-slate">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <StatusPill tone={orderProgressTone(progress)}>{progress}</StatusPill>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate md:grid-cols-4">
                  <RecordItem label="日期" value={formatDateTime(order.createdAt)} />
                  <RecordItem label="类别" value={orderCategoryLabel(order)} />
                  <RecordItem label="资源" value={orderResourceLabel(order)} />
                  <RecordItem label="状态" value={progress} />
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

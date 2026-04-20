import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { ApiError, fetchOrders } from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  formatAmount,
  getCancelledAt,
  getCancellationReason,
  orderCategoryLabel,
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
    <>
      <PageHero
        eyebrow="Cancelled History"
        title="取消记录"
        description="取消记录页用于集中回看已经取消的预约。你可以在这里查看取消时间、预约人、费用和备注，方便后续查询与管理。"
        aside={
          <div className="grid gap-3">
            <MetricCard label="取消总数" value={String(cancelledOrders.length)} />
            <MetricCard
              label="最近取消"
              value={
                cancelledOrders[0]
                  ? formatDateTime(getCancelledAt(cancelledOrders[0]))
                  : "暂无"
              }
            />
          </div>
        }
      />

      <PageSection
        title="历史取消记录"
        description="本页只展示已取消预约的历史信息，每条记录都带取消时间、预约人和补充备注。"
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
          <StatePanel
            tone="loading"
            title="正在载入取消记录"
            description="页面正在整理你历史上已取消的预约条目。"
          />
        ) : ordersQuery.isError ? (
          <StatePanel
            tone="danger"
            title="取消记录暂时无法加载"
            description={(ordersQuery.error as ApiError).message}
          />
        ) : !cancelledOrders.length ? (
          <EmptyPanel
            title="当前没有取消记录"
            description="还没有任何已取消预约时，这里会保持为空。"
          />
        ) : (
          <div className="grid gap-4">
            {cancelledOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="rounded-[26px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss hover:shadow-panel"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-moss">
                      取消时间
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">
                      {formatDateTime(getCancelledAt(order))}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="danger">已取消</StatusPill>
                    <StatusPill>{orderCategoryLabel(order)}</StatusPill>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <InfoCard label="预约人" value={order.userEmail} />
                  <InfoCard label="资源" value={orderResourceLabel(order)} />
                  <InfoCard label="费用" value={formatAmount(order.totalAmountCents)} />
                  <InfoCard label="备注" value={getCancellationReason(order)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
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

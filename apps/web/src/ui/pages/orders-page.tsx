import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { ApiError, fetchOrders } from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import { EmptyPanel, StatePanel, StatusPill } from "../user-experience-kit";
import {
  bizTypeLabel,
  getCancelledAt,
  orderCategoryLabel,
  orderProgressLabel,
  orderProgressTone,
  orderResourceLabel,
  orderTimeLabel
} from "./order-utils";

type OrderFilter = "all" | "pending" | "ongoing" | "finished" | "cancelled";

const filterLabels: Record<OrderFilter, string> = {
  all: "全部记录",
  pending: "待确认",
  ongoing: "进行中",
  finished: "已结束",
  cancelled: "已取消"
};

export function OrdersPage() {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders
  });

  const metrics = useMemo(() => {
    const orders = ordersQuery.data ?? [];

    return {
      total: orders.length,
      pending: orders.filter((order) => orderProgressLabel(order) === "待确认").length,
      ongoing: orders.filter((order) => orderProgressLabel(order) === "进行中").length,
      finished: orders.filter((order) => orderProgressLabel(order) === "已结束").length,
      cancelled: orders.filter((order) => orderProgressLabel(order) === "已取消").length
    };
  }, [ordersQuery.data]);

  const filteredOrders = useMemo(() => {
    const orders = [...(ordersQuery.data ?? [])].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );

    if (filter === "all") {
      return orders;
    }

    return orders.filter((order) => {
      const progress = orderProgressLabel(order);

      switch (filter) {
        case "pending":
          return progress === "待确认";
        case "ongoing":
          return progress === "进行中" || progress === "已确认";
        case "finished":
          return progress === "已结束";
        case "cancelled":
          return progress === "已取消";
        default:
          return true;
      }
    });
  }, [filter, ordersQuery.data]);

  return (
    <>
      <PageHero
        eyebrow="My Records"
        title="我的订单与预约状态"
        description="个人中心里的记录页统一展示日期、类别、资源和状态。完成预约后，你可以先在这里看整体状态，再进入详情页处理签到、取消或重新预约。"
        aside={
          <div className="grid gap-3">
            <MetricCard label="全部记录" value={String(metrics.total)} />
            <MetricCard label="进行中" value={String(metrics.ongoing)} />
            <MetricCard label="已取消" value={String(metrics.cancelled)} />
          </div>
        }
      />

      <PageSection
        title="记录总览"
        description="列表集中展示你发起过的预约和报名记录，方便快速区分待确认、进行中、已结束和已取消状态。"
        action={
          <Link
            to="/orders/cancellations"
            className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          >
            查看取消记录
          </Link>
        }
      >
        <div className="flex flex-wrap gap-2">
          {(
            Object.entries(filterLabels) as Array<[OrderFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                filter === value
                  ? "border-ember bg-ember text-white"
                  : "border-navy/10 bg-white text-ink hover:border-moss"
              }`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {ordersQuery.isLoading ? (
            <StatePanel
              tone="loading"
              title="正在整理我的订单"
              description="页面正在汇总你的预约类别、资源名称和最新状态。"
            />
          ) : ordersQuery.isError ? (
            <StatePanel
              tone="danger"
              title="我的订单暂时无法加载"
              description={(ordersQuery.error as ApiError).message}
            />
          ) : !filteredOrders.length ? (
            <EmptyPanel
              title="当前筛选条件下没有记录"
              description="你可以切换状态筛选，或先返回首页发起新的预约。"
            />
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => {
                const progress = orderProgressLabel(order);

                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="rounded-[26px] border border-ink/10 bg-white px-5 py-5 transition hover:border-moss hover:shadow-panel"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-moss">
                          {formatDateTime(order.createdAt)}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-ink">
                          {orderResourceLabel(order)}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill>{orderCategoryLabel(order)}</StatusPill>
                        <StatusPill tone={orderProgressTone(progress)}>
                          {progress}
                        </StatusPill>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate md:grid-cols-4">
                      <RecordItem label="类别" value={bizTypeLabel(order)} />
                      <RecordItem label="资源" value={orderResourceLabel(order)} />
                      <RecordItem label="时间" value={orderTimeLabel(order)} />
                      <RecordItem
                        label={progress === "已取消" ? "取消时间" : "当前状态"}
                        value={
                          progress === "已取消"
                            ? formatDateTime(getCancelledAt(order))
                            : progress
                        }
                      />
                    </div>

                    <p className="mt-4 text-sm text-ink/65">
                      订单号 {order.orderNo} · 点击查看详情与后续操作
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PageSection>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
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

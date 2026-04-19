import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import type { ActivityListItem, OrderDetailResponse } from "@campusbook/shared-types";

import {
  ApiError,
  fetchActivities,
  fetchOrders,
  fetchResources
} from "../../lib/api";
import { formatDateTime } from "../../lib/date";
import { useSessionStore } from "../../store/session-store";
import { PageHero } from "../page-hero";
import { PageSection } from "../page-section";
import {
  EmptyPanel,
  HighlightPanel,
  StatePanel,
  StatusPill
} from "../user-experience-kit";

const studentServices = [
  {
    title: "体育空间",
    description: "查看球场和组合场地的可用时段，快速完成预约。",
    href: "/sports",
    badge: "Sports"
  },
  {
    title: "校园活动",
    description: "浏览近期活动，完成报名、抢票和结果查看。",
    href: "/activities",
    badge: "Activities"
  },
  {
    title: "学术空间",
    description: "预约自习室、研讨室和协作空间的连续时间段。",
    href: "/spaces",
    badge: "Study"
  }
];

export function HomePage() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  if (status === "authenticated" && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return status === "authenticated" ? <StudentHome /> : <GuestHome />;
}

function GuestHome() {
  return (
    <>
      <PageHero
        eyebrow="Unified Access"
        title="登录后进入对应的校园服务首页"
        description="CampusBook 为学生提供统一预约与活动入口，为教师或管理身份提供工作台。未登录时不展示复杂说明，只保留最直接的身份入口。"
        aside={
          <>
            <p className="font-medium text-ink">快速进入</p>
            <div className="mt-4 grid gap-3">
              <Link
                to="/login"
                className="rounded-2xl bg-ember px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-ember/90"
              >
                进入统一登录
              </Link>
              <div className="rounded-2xl border border-navy/10 bg-white px-4 py-4 text-xs leading-6 text-slate">
                <p>学生入口：demo@campusbook.top / demo123456</p>
                <p>教师入口：admin@campusbook.top / admin123456</p>
              </div>
            </div>
          </>
        }
      />

      <PageSection
        title="登录后你会看到什么"
        description="学生和教师进入的是两套不同的首页结构，真实使用时不会在首页看到大段平台理念说明。"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <HighlightPanel
            eyebrow="Student Home"
            title="学生登录后"
            description="直接进入校园服务首页，只保留体育空间、校园活动和学术空间三个最常用入口，并能查看历史记录与近期通知。 "
          />
          <HighlightPanel
            eyebrow="Teacher Workspace"
            title="教师或管理登录后"
            description="直接进入工作台，重点查看资源、活动、规则更新情况和快捷维护入口，不再先经过学生端首页。"
          />
        </div>
      </PageSection>
    </>
  );
}

function StudentHome() {
  const user = useSessionStore((state) => state.user);
  const sportsQuery = useQuery({
    queryKey: ["resources", "sports_facility", "student-home"],
    queryFn: () => fetchResources("sports_facility")
  });
  const academicQuery = useQuery({
    queryKey: ["resources", "academic_space", "student-home"],
    queryFn: () => fetchResources("academic_space")
  });
  const activitiesQuery = useQuery({
    queryKey: ["activities", "student-home"],
    queryFn: fetchActivities
  });
  const ordersQuery = useQuery({
    queryKey: ["orders", "student-home"],
    queryFn: fetchOrders
  });

  const recentActivities =
    activitiesQuery.data
      ?.filter((activity) => activity.status === "published")
      .slice(0, 3) ?? [];
  const recentOrders = ordersQuery.data?.slice(0, 4) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Student Services"
        title={`欢迎回来，${user?.email ?? "同学"}`}
        description="这里就是学生登录后的真实首页。你最常用的三类校园服务会直接放在第一屏，历史记录和近期活动通知也集中放在同一页。"
        aside={
          <>
            <p className="font-medium text-ink">今日入口</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill tone="brand">体育空间</StatusPill>
              <StatusPill tone="brand">校园活动</StatusPill>
              <StatusPill tone="brand">学术空间</StatusPill>
            </div>
            <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm text-slate">
              <p>最近记录：{ordersQuery.data?.length ?? 0} 条</p>
              <p className="mt-1">近期通知：{recentActivities.length} 条</p>
            </div>
          </>
        }
      />

      <PageSection
        title="常用服务"
        description="学生首页只保留三类最常用的服务入口，不再把所有功能和说明堆在第一屏。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {studentServices.map((service) => (
            <StudentServiceCard
              key={service.href}
              title={service.title}
              description={service.description}
              href={service.href}
              badge={service.badge}
              stat={
                service.href === "/sports"
                  ? `${sportsQuery.data?.length ?? 0} 类资源`
                  : service.href === "/activities"
                    ? `${activitiesQuery.data?.length ?? 0} 场活动`
                    : `${academicQuery.data?.length ?? 0} 类资源`
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        title="历史记录"
        description="最近的预约、报名和状态变化会出现在这里，方便你快速回看。"
        action={
          <Link
            to="/orders"
            className="rounded-full border border-navy/10 bg-sand px-4 py-2 text-sm text-ink transition hover:border-moss"
          >
            查看全部记录
          </Link>
        }
      >
        {ordersQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title="正在载入历史记录"
            description="页面正在整理你最近的预约与活动报名结果。"
          />
        ) : ordersQuery.isError ? (
          <StatePanel
            tone="danger"
            title="历史记录暂时无法读取"
            description={(ordersQuery.error as ApiError).message}
          />
        ) : !recentOrders.length ? (
          <EmptyPanel
            title="你还没有最近记录"
            description="完成一次预约或活动报名后，最近记录会立即显示在这里。"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentOrders.map((order) => (
              <HistoryCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="近期活动通知栏"
        description="这里展示近期值得关注的活动，方便你从首页直接进入活动页。"
      >
        {activitiesQuery.isLoading ? (
          <StatePanel
            tone="loading"
            title="正在载入近期活动"
            description="页面正在准备最近可关注的活动通知。"
          />
        ) : activitiesQuery.isError ? (
          <StatePanel
            tone="danger"
            title="近期活动暂时无法读取"
            description={(activitiesQuery.error as ApiError).message}
          />
        ) : !recentActivities.length ? (
          <EmptyPanel
            title="近期没有新的活动通知"
            description="稍后刷新页面，或直接进入校园活动页查看全部内容。"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {recentActivities.map((activity) => (
              <NoticeCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}

function StudentServiceCard({
  title,
  description,
  href,
  badge,
  stat
}: {
  title: string;
  description: string;
  href: string;
  badge: string;
  stat: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-[28px] border border-navy/10 bg-gradient-to-br from-white via-white to-sand px-6 py-6 transition hover:-translate-y-1 hover:border-moss hover:shadow-panel"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-moss">{badge}</p>
      <h3 className="mt-3 text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate">{description}</p>
      <div className="mt-6 flex items-center justify-between">
        <span className="rounded-full bg-sand px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate">
          {stat}
        </span>
        <span className="text-sm font-medium text-ember transition group-hover:translate-x-1">
          进入 →
        </span>
      </div>
    </Link>
  );
}

function HistoryCard({ order }: { order: OrderDetailResponse }) {
  return (
    <div className="rounded-[26px] border border-navy/10 bg-white px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-moss">
            {order.bizType === "activity_registration" ? "校园活动" : "资源服务"}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-ink">{order.orderNo}</h3>
        </div>
        <StatusPill
          tone={
            order.status === "confirmed"
              ? "success"
              : order.status === "cancelled"
                ? "danger"
                : "brand"
          }
        >
          {orderStatusLabel(order.status)}
        </StatusPill>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate">{describeOrder(order)}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/45">
        {formatDateTime(order.createdAt)}
      </p>
    </div>
  );
}

function NoticeCard({ activity }: { activity: ActivityListItem }) {
  return (
    <Link
      to="/activities"
      className="rounded-[26px] border border-navy/10 bg-gradient-to-br from-white to-sand px-5 py-5 transition hover:-translate-y-1 hover:border-moss"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-moss">Campus Notice</p>
      <h3 className="mt-3 text-lg font-semibold text-ink">{activity.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate">
        {activity.location || "活动地点待补充"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="brand">{activityStatusLabel(activity.status)}</StatusPill>
        <StatusPill tone="success">{`剩余 ${activity.remainingQuota}`}</StatusPill>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/45">
        {formatDateTime(activity.saleStartTime)}
      </p>
    </Link>
  );
}

function describeOrder(order: OrderDetailResponse) {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceUnitName} · ${formatDateTime(order.academicReservation.startTime)}`;
  }

  if (order.sportsReservationSlots.length) {
    const firstSlot = order.sportsReservationSlots[0];
    return firstSlot
      ? `${firstSlot.resourceName} · ${order.sportsReservationSlots.length} 个槽位`
      : "体育空间预约";
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return "近期服务记录";
}

function orderStatusLabel(status: OrderDetailResponse["status"]) {
  switch (status) {
    case "pending_confirmation":
      return "待确认";
    case "confirmed":
      return "已确认";
    case "cancelled":
      return "已取消";
    case "no_show":
      return "已爽约";
  }
}

function activityStatusLabel(status: ActivityListItem["status"]) {
  switch (status) {
    case "draft":
      return "草稿";
    case "published":
      return "已发布";
    case "closed":
      return "已关闭";
    case "cancelled":
      return "已取消";
  }
}
